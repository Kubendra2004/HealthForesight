from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from auth.auth import get_current_user
from database.models_sql import User
import json
from datetime import datetime

router = APIRouter(
    prefix="/ws",
    tags=["WebSocket - Real-time"]
)

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"✅ User {user_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"❌ User {user_id} disconnected")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)
    
    async def broadcast(self, message: dict, exclude_user: str = None):
        """Broadcast message to all connected users"""
        for user_id, connections in self.active_connections.items():
            if user_id != exclude_user:
                for connection in connections:
                    await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/connect")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time updates.
    Usage: ws://localhost:8000/ws/connect?token=<jwt_token>
    """
    # In production, validate JWT token here
    user_id = token[:10]  # Simplified for demo
    
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Echo back with timestamp
            response = {
                "type": "echo",
                "data": message,
                "timestamp": datetime.utcnow().isoformat()
            }
            await manager.send_personal_message(response, user_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Helper functions for other routers to send real-time updates

async def notify_bed_update(bed_id: str, status: str):
    """Notify all users about bed status change"""
    message = {
        "type": "bed_update",
        "bed_id": bed_id,
        "status": status,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(message)

async def notify_user(user_id: str, notification_type: str, content: dict):
    """Send notification to specific user"""
    message = {
        "type": notification_type,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.send_personal_message(message, user_id)
