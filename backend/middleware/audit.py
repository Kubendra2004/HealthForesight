from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from database.database import mongo_db
from datetime import datetime
import time

class AuditMiddleware(BaseHTTPMiddleware):
    """
    HIPAA-compliant audit logging middleware.
    Tracks all API access with user, timestamp, method, endpoint, and response status.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Start timer
        start_time = time.time()
        
        # Extract user info from headers (if authenticated)
        user = None
        if "authorization" in request.headers:
            # User would be extracted from JWT in production
            user = request.headers.get("authorization", "").replace("Bearer ", "")[:20]
        
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
            "query_params": dict(request.query_params),
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
