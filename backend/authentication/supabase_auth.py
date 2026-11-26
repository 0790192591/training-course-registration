
import os
import jwt

from jwt import PyJWKClient
from jwt.exceptions import PyJWTError

from django.db import connection, DatabaseError
from django.core.exceptions import ImproperlyConfigured

from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


# =====================================================
# SUPABASE CONFIGURATION
# =====================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")

if not SUPABASE_URL:
    raise ImproperlyConfigured(
        "SUPABASE_URL is missing from environment variables."
    )

SUPABASE_URL = SUPABASE_URL.rstrip("/")

JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
SUPABASE_ISSUER = f"{SUPABASE_URL}/auth/v1"

jwks_client = PyJWKClient(JWKS_URL)


# =====================================================
# SUPABASE USER
# =====================================================

class SupabaseUser:

    def __init__(self, payload, role):
        self.id = payload.get("sub")
        self.email = payload.get("email")
        self.role = role

        self.is_authenticated = True
        self.is_anonymous = False

    def __str__(self):
        return self.email or self.id or "Supabase User"


# =====================================================
# SUPABASE AUTHENTICATION
# =====================================================

class SupabaseAuthentication(BaseAuthentication):

    def authenticate(self, request):

        # Get Authorization header
        auth_header = request.META.get("HTTP_AUTHORIZATION")

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationFailed(
                "Invalid authorization header."
            )

        token = parts[1]

        # -------------------------------------------------
        # STEP 1: VERIFY SUPABASE ACCESS TOKEN
        # -------------------------------------------------

        try:

            signing_key = jwks_client.get_signing_key_from_jwt(
                token
            )

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[signing_key.algorithm_name],
                audience="authenticated",
                issuer=SUPABASE_ISSUER,
            )

            user_id = payload.get("sub")

            if not user_id:
                raise AuthenticationFailed(
                    "Supabase token does not contain a user ID."
                )

        except AuthenticationFailed:
            raise

        except PyJWTError as error:

            print(
                "SUPABASE JWT ERROR:",
                type(error).__name__,
                str(error),
                flush=True,
            )

            raise AuthenticationFailed(
                "Invalid or expired Supabase token."
            )

        except Exception as error:

            print(
                "SUPABASE TOKEN VERIFICATION ERROR:",
                type(error).__name__,
                str(error),
                flush=True,
            )

            raise AuthenticationFailed(
                "Unable to verify Supabase token."
            )

        # -------------------------------------------------
        # STEP 2: GET USER ROLE FROM SUPABASE POSTGRESQL
        # -------------------------------------------------

        try:

            with connection.cursor() as cursor:

                cursor.execute(
                    """
                    SELECT role
                    FROM public.profiles
                    WHERE id = %s
                    LIMIT 1
                    """,
                    [user_id],
                )

                row = cursor.fetchone()

            if not row:

                print(
                    "SUPABASE PROFILE NOT FOUND:",
                    user_id,
                    flush=True,
                )

                raise AuthenticationFailed(
                    "User profile not found."
                )

            role = row[0]

            if role not in ("admin", "employee"):

                print(
                    "INVALID USER ROLE:",
                    user_id,
                    role,
                    flush=True,
                )

                raise AuthenticationFailed(
                    "User role is invalid."
                )

        except AuthenticationFailed:
            raise

        except DatabaseError as error:

            print(
                "DATABASE ROLE ERROR:",
                type(error).__name__,
                str(error),
                flush=True,
            )

            raise AuthenticationFailed(
                "Unable to verify user role."
            )

        except Exception as error:

            print(
                "UNEXPECTED ROLE ERROR:",
                type(error).__name__,
                str(error),
                flush=True,
            )

            raise AuthenticationFailed(
                "Unexpected error while checking user role."
            )

        # -------------------------------------------------
        # STEP 3: RETURN AUTHENTICATED USER
        # -------------------------------------------------

        user = SupabaseUser(
            payload=payload,
            role=role,
        )

        return (user, payload)

    # -----------------------------------------------------
    # AUTHENTICATION CHALLENGE
    # -----------------------------------------------------

    def authenticate_header(self, request):
        return "Bearer"
