from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from database.database import mongo_db
from datetime import datetime
import time
from jose import JWTError, jwt
from auth.auth import ALGORITHM, SECRET_KEY

class AuditMiddleware(BaseHTTPMiddleware):
    """
    Audit request metadata without recording bearer credentials or query values.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Resolve the token subject without storing any part of the credential.
        user = None
        authorization = request.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            try:
                payload = jwt.decode(authorization[7:], SECRET_KEY, algorithms=[ALGORITHM])
                user = payload.get("sub")
            except JWTError:
                user = None
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log to audit collection
        audit_entry = {
            "timestamp": datetime.utcnow(),
            "user": user or "anonymous",
            "method": request.method,
            "endpoint": str(request.url.path),
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
            "ip_address": request.client.host if request.client else None
        }
        
        # Async insert (don't await to avoid blocking response)
        try:
            await mongo_db.audit_logs.insert_one(audit_entry)
        except Exception as e:
            # Log error but don't fail request
            print(f"Audit logging failed: {e}")
        
        return response
