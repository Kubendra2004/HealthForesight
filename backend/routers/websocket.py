from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
from auth.auth import SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
import json
from datetime import datetime

router = APIRouter(
    prefix="/ws",
    tags=["WebSocket - Real-time"]
)

class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # user_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        print(f"✅ User {user_id} connected. Total users online: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        print(f"❌ User {user_id} disconnected")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user"""
        if user_id in self.active_connections:
            # Send to all active sessions of this user (e.g. mobile + desktop)
            # Filter out closed connections if any
            active_sockets = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                    active_sockets.append(connection)
                except Exception as e:
                    print(f"Error sending to {user_id}: {e}")
            self.active_connections[user_id] = active_sockets

    async def broadcast_event(self, event_type: str, payload: Any, exclude_user: str = None):
        """Standardized broadcast method"""
        message = {
            "type": event_type,
            "data": payload,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message, exclude_user)

    async def broadcast(self, message: dict, exclude_user: str = None):
        """Broadcast raw message to all connected users"""
        for user_id, connections in self.active_connections.items():
            if user_id != exclude_user:
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass # Stale connection will be cleaned up on disconnect

manager = ConnectionManager()

@router.websocket("/connect")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    WebSocket endpoint. Authenticates via JWT token in query param.
    ws://localhost:8000/ws/connect?token=<jwt_token>
    """
    user_id = None
    try:
        # Validate User
        if not token:
            await websocket.close(code=4003, reason="Token required")
            return
            
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub") # username
            if user_id is None:
                await websocket.close(code=4003, reason="Invalid token payload")
                return
        except JWTError:
             await websocket.close(code=4003, reason="Invalid token")
             return

        # Connect
        await manager.connect(websocket, user_id)
        
        # Main Loop
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Basic Echo for Health Check
            if message_data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }, user_id)

    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WS Error: {e}")
        try:
            await websocket.close()
        except:
            pass

# Helper functions for other routers
async def notify_bed_update(bed_id: str, status: str):
    await manager.broadcast_event("bed_update", {"bed_id": bed_id, "status": status})

async def notify_user(user_id: str, notification_type: str, content: dict):
    await manager.send_personal_message({
        "type": notification_type,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    }, user_id)
