from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database.database import mongo_db, get_db
from database.models_mongo import MessageData
from auth.auth import get_current_user
from routers.websocket import manager
from datetime import datetime
from bson import ObjectId

router = APIRouter(
    prefix="/messages",
    tags=["Messaging"]
)

def serialize_doc(doc):
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.post("/send", response_model=dict)
async def send_message(data: MessageData, current_user = Depends(get_current_user)):
    try:
        # Enforce sender is current user
        if data.sender_id != current_user.username:
             # Or allow if using IDs, but for now assuming username is ID or we map it
             # Let's enforce it to be safe, or just overwrite it
             data.sender_id = current_user.username

        # Save to DB
        msg_dict = data.dict()
        result = await mongo_db.messages.insert_one(msg_dict)
        msg_dict["_id"] = str(result.inserted_id)
        
        # Convert datetime to string for JSON serialization
        if "timestamp" in msg_dict and isinstance(msg_dict["timestamp"], datetime):
            msg_dict["timestamp"] = msg_dict["timestamp"].isoformat()
            
        # Real-time Push to Receiver
        await manager.send_personal_message({
            "type": "new_message",
            "data": msg_dict
        }, data.receiver_id)
        
        # Real-time Push to Sender (so they see it 'sent' instantly if using optimistic UI, or for multi-device sync)
        await manager.send_personal_message({
            "type": "message_sent",
            "data": msg_dict
        }, data.sender_id)

        return {"message": "Message sent", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{other_user_id}", response_model=List[dict])
async def get_chat_history(other_user_id: str, current_user = Depends(get_current_user)):
    try:
        # Fetch messages where (sender=me AND receiver=other) OR (sender=other AND receiver=me)
        cursor = mongo_db.messages.find({
            "$or": [
                {"sender_id": current_user.username, "receiver_id": other_user_id},
                {"sender_id": other_user_id, "receiver_id": current_user.username}
            ]
        }).sort("timestamp", 1)
        
        messages = await cursor.to_list(length=1000)
        return [serialize_doc(msg) for msg in messages]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
