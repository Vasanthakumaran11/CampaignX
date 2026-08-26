import logging
from typing import Optional
from supabase import create_client, Client
from app.config import get_settings

logger = logging.getLogger(__name__)

_supabase_admin_client: Optional[Client] = None


def get_supabase_admin() -> Optional[Client]:
    """
    Returns the Supabase admin client using the service role key.
    Reuses client singleton instance.
    """
    global _supabase_admin_client
    settings = get_settings()

    if _supabase_admin_client is not None:
        return _supabase_admin_client

    if not settings.SUPABASE_URL or "your-project-ref" in settings.SUPABASE_URL:
        logger.warning("Supabase URL is not configured. Update backend/.env with your Supabase credentials.")
        return None

    if not settings.SUPABASE_SERVICE_ROLE_KEY or "your-service-role" in settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.warning("Supabase Service Role Key is not configured. Update backend/.env.")
        return None

    try:
        _supabase_admin_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        logger.info("Supabase admin client initialized successfully.")
        return _supabase_admin_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def get_signed_url(bucket: str, path: str, expires_in: int = 3600) -> Optional[str]:
    """
    Generates a temporary signed URL for a file stored in a private Supabase Storage bucket.
    """
    client = get_supabase_admin()
    if not client or not path:
        return None
    try:
        res = client.storage.from_(bucket).create_signed_url(path, expires_in)
        if isinstance(res, dict) and "signedURL" in res:
            return res["signedURL"]
        elif hasattr(res, "signed_url"):
            return res.signed_url
        elif isinstance(res, dict) and "signedUrl" in res:
            return res["signedUrl"]
        return str(res)
    except Exception as e:
        logger.error(f"Error generating signed URL for {bucket}/{path}: {e}")
        return None


def upload_file_to_storage(bucket: str, path: str, file_bytes: bytes, content_type: str = "application/octet-stream") -> bool:
    """
    Uploads raw file bytes to Supabase Storage.
    """
    client = get_supabase_admin()
    if not client:
        raise RuntimeError("Supabase client is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.")
    try:
        # Check if file exists to determine upsert
        res = client.storage.from_(bucket).upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        return True
    except Exception as e:
        logger.error(f"Error uploading file to storage {bucket}/{path}: {e}")
        raise e


def delete_file_from_storage(bucket: str, path: str) -> bool:
    """
    Deletes a file from Supabase Storage.
    """
    client = get_supabase_admin()
    if not client or not path:
        return False
    try:
        client.storage.from_(bucket).remove([path])
        return True
    except Exception as e:
        logger.error(f"Error deleting file from storage {bucket}/{path}: {e}")
        return False


def ensure_storage_buckets() -> None:
    """
    Ensures that the required private storage buckets exist.
    """
    client = get_supabase_admin()
    if not client:
        return
    settings = get_settings()
    buckets_to_ensure = [
        (settings.BUCKET_GUIDELINES, 20971520, ["application/pdf"]),
        (settings.BUCKET_LOGOS, 10485760, ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]),
        (settings.BUCKET_SAMPLES, 10485760, ["text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"]),
    ]

    try:
        existing = client.storage.list_buckets()
        existing_names = [b.name if hasattr(b, "name") else b.get("name") for b in existing] if existing else []

        for b_name, file_size_limit, allowed_mimes in buckets_to_ensure:
            if b_name not in existing_names:
                try:
                    client.storage.create_bucket(
                        b_name,
                        options={"public": False, "file_size_limit": file_size_limit, "allowed_mime_types": allowed_mimes}
                    )
                    logger.info(f"Created Supabase storage bucket: {b_name}")
                except Exception as b_err:
                    logger.warning(f"Could not create bucket {b_name}: {b_err}")
    except Exception as e:
        logger.warning(f"Error listing/verifying storage buckets: {e}")
