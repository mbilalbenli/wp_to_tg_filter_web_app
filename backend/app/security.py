import hashlib, os, secrets
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me-please-use-env-32chars")
ALGO = "HS256"
bearer = HTTPBearer(auto_error=False)


def hash_password(pw: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100_000).hex()
    return f"{salt}${h}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        salt, h = stored.split("$", 1)
    except ValueError:
        return secrets.compare_digest(pw, stored)
    calc = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100_000).hex()
    return secrets.compare_digest(calc, h)


def create_token(username: str) -> str:
    payload = {"sub": username, "exp": datetime.now(timezone.utc) + timedelta(hours=24)}
    return jwt.encode(payload, SECRET, algorithm=ALGO)


def require_auth(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds:
        raise HTTPException(401, "Kimlik doğrulama gerekli")
    try:
        payload = jwt.decode(creds.credentials, SECRET, algorithms=[ALGO])
    except Exception:
        raise HTTPException(401, "Geçersiz token")
    return payload.get("sub")
