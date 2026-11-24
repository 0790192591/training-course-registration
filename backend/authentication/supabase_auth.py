
import os
import jwt

from jwt import PyJWKClient
from django.db import connection, DatabaseError
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


SUPABASE_URL = os.getenv("SUPABASE_URL")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

jwks_client = PyJWKClient(JWKS_URL)


class SupabaseUser:
    def __init__(self, payload, role):
        self.id = payload.get("sub")
        self.email = payload.get("email")
        self.role = role
        self.is_authenticated = True
        self.is_anonymous = False

    def __str__(self):
        return self.email or self.id


class SupabaseAuthentication(BaseAuthentication):

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION")

        if not auth_header:
            return None

        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise AuthenticationFailed("Invalid authorization header.")

        token = parts[1]

        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[signing_key.algorithm_name],
                audience="authenticated",
                issuer=f"{SUPABASE_URL}/auth/v1",
            )

            user_id = payload.get("sub")

            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT role FROM public.profiles WHERE id = %s",
                    [user_id]
                )
                row = cursor.fetchone()

            if not row or row[0] not in ("admin", "employee"):
                raise AuthenticationFailed(
                    "User profile or role not found."
                )

            user = SupabaseUser(payload, row[0])
            return (user, payload)

        except AuthenticationFailed:
            raise

        except jwt.PyJWTError as error:
            print(
                "SUPABASE JWT VERIFICATION ERROR:",
                type(error).__name__,
                str(error),
            )
            raise AuthenticationFailed(
                "Invalid or expired Supabase token."
            )

        except DatabaseError:
            raise AuthenticationFailed(
                "Unable to verify user role."
            )
