from fastapi import Header, HTTPException, status

from app.config import settings


def require_admin(x_admin_user: str | None = Header(default=None)) -> None:
    if x_admin_user != settings.allowed_admin_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication is required.",
        )

