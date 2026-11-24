
import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


# Locate the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env
load_dotenv(BASE_DIR / ".env", override=False)

# Read Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

# Private Supabase Storage bucket
BUCKET_NAME = "course-books"

# Check required environment variables
if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError(
        "SUPABASE_URL or SUPABASE_SECRET_KEY is missing from backend/.env"
    )

# Connect to Supabase
supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


def create_course_book_signed_url(file_path, expires_in=3600):
    """
    Generate a temporary signed URL for a private PDF file.
    """

    result = supabase.storage.from_(BUCKET_NAME).create_signed_url(
        file_path,
        expires_in
    )

    signed_url = result.get("signedURL") or result.get("signedUrl")

    if not signed_url:
        raise RuntimeError("Supabase did not return a signed URL.")

    return signed_url


def upload_course_book(file_path, file_content):
    """
    Upload a PDF file to the private Supabase Storage bucket.
    """

    result = supabase.storage.from_(BUCKET_NAME).upload(
        file_path,
        file_content,
        file_options={
            "content-type": "application/pdf",
            "upsert": "false",
        }
    )

    return result


def delete_course_book(file_path):
    """
    Delete a PDF file from the private Supabase Storage bucket.
    """

    result = supabase.storage.from_(BUCKET_NAME).remove([file_path])

    return result
