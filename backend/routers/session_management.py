from fastapi import APIRouter, HTTPException, Depends, Header
from database.database import mongo_db
from auth.auth import get_current_user
from database.models_sql import User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import uuid

router = APIRouter(
    prefix="/auth",
    tags=["Authentication - Session Management"]
)

# Note: This router extends the main auth.py, should be merged or imported there

class SessionInfo(BaseModel):
    device_info: Optional[str] = None
    ip_address: Optional[str] = None

@router.get("/sessions")
async def get_active_sessions(current_user: User = Depends(get_current_user)):
    """Get all active sessions for current user"""
    sessions = await mongo_db.user_sessions.find(
        {"username": current_user.username, "active": True}
    ).to_list(100)
    
    for session in sessions:
        session["id"] = str(session["_id"])
        del session["_id"]
    
    return {"sessions": sessions}

@router.post("/session/create")
async def create_session(
    session_info: SessionInfo,
    user_agent: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user)
):
    """Create new session with device tracking"""
    session_data = {
        "session_id": str(uuid.uuid4()),
        "username": current_user.username,
        "device_info": session_info.device_info or user_agent,
        "ip_address": session_info.ip_address,
        "created_at": datetime.utcnow(),
        "last_activity": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
        "active": True
    }
    
    result = await mongo_db.user_sessions.insert_one(session_data)
    return {
        "session_id": session_data["session_id"],
        "expires_at": session_data["expires_at"]
    }

@router.delete("/sessions/{session_id}")
async def logout_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Logout specific session"""
    result = await mongo_db.user_sessions.update_one(
        {"session_id": session_id, "username": current_user.username},
        {"$set": {"active": False, "logged_out_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session terminated"}

@router.delete("/sessions/all")
async def logout_all_sessions(current_user: User = Depends(get_current_user)):
    """Logout all sessions for current user"""
    result = await mongo_db.user_sessions.update_many(
        {"username": current_user.username, "active": True},
        {"$set": {"active": False, "logged_out_at": datetime.utcnow()}}
    )
    
    return {"message": f"Logged out {result.modified_count} sessions"}

# Auto-logout check (should be called by middleware)
async def check_session_expiry():
    """Deactivate expired sessions (run periodically)"""
    now = datetime.utcnow()
    result = await mongo_db.user_sessions.update_many(
        {"expires_at": {"$lt": now}, "active": True},
        {"$set": {"active": False, "expired": True}}
    )
    print(f"🔒 Expired {result.modified_count} sessions")
    return result.modified_count
