from fastapi import APIRouter, HTTPException, Depends, Query
from database.database import mongo_db
from auth.auth import get_current_user
from database.models_sql import User, UserRole
from typing import Optional
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/admin/audit",
    tags=["Admin - Audit Logs"]
)

@router.get("/logs")
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user: Optional[str] = None,
    endpoint: Optional[str] = None,
    start_date: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve audit logs with filtering.
    Only accessible by admins.
    """
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Build query
    query = {}
    if user:
        query["user"] = {"$regex": user, "$options": "i"}
    if endpoint:
        query["endpoint"] = {"$regex": endpoint, "$options": "i"}
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query["timestamp"] = {"$gte": start}
        except:
            raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Enhanced query for "important" logs
    # Exclude routine GET requests or status checks if not explicitly requested
    if not query:
        # Default behavior: Show only mutations and critical auth events
        query["$or"] = [
            {"method": {"$in": ["POST", "PUT", "DELETE", "PATCH"]}},
            {"endpoint": {"$regex": "login|logout|auth|admin", "$options": "i"}},
            {"status_code": {"$gte": 400}} # Show all errors
        ]

    # Fetch logs
    logs = await mongo_db.audit_logs.find(query).skip(skip).limit(limit).sort("timestamp", -1).to_list(limit)
    
    # Convert ObjectId to string
    for log in logs:
        log["id"] = str(log["_id"])
        del log["_id"]
    
    return {
        "total": await mongo_db.audit_logs.count_documents(query),
        "logs": logs
    }

@router.get("/stats")
async def get_audit_stats(current_user: User = Depends(get_current_user)):
    """Get audit statistics for last 24 hours."""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    yesterday = datetime.utcnow() - timedelta(days=1)
    
    # Count by endpoint
    pipeline = [
        {"$match": {"timestamp": {"$gte": yesterday}}},
        {"$group": {"_id": "$endpoint", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    
    top_endpoints = await mongo_db.audit_logs.aggregate(pipeline).to_list(10)
    
    return {
        "total_requests_24h": await mongo_db.audit_logs.count_documents({"timestamp": {"$gte": yesterday}}),
        "top_endpoints": [{"endpoint": e["_id"], "count": e["count"]} for e in top_endpoints]
    }
