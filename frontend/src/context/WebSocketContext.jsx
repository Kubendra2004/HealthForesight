import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [startSocket, setStartSocket] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // Store socket in ref to prevent multiple connections during re-renders
    const socketRef = useRef(null);

    useEffect(() => {
        if (token && user) {
            connect();
        } else {
            disconnect();
        }

        return () => {
            disconnect();
        };
    }, [token, user]);

    const connect = () => {
        // Prevent duplicate connections
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        // Use VITE_API_URL but replace http with ws
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/connect?token=${token}`;

        console.log("🔌 Connecting to WebSocket...", wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("✅ WebSocket Connected");
            setIsConnected(true);
            setSocket(ws);
            
            // Heartbeat loop to keep connection alive
            // Send a ping every 30 seconds
            if (!ws.pingInterval) {
                 ws.pingInterval = setInterval(() => {
                     if (ws.readyState === WebSocket.OPEN) {
                         ws.send(JSON.stringify({ type: 'ping' }));
                     }
                 }, 30000);
            }
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("📩 WS Message:", message);
                setLastMessage(message);
            } catch (error) {
                console.error("Error parsing WS message:", error);
            }
        };

        ws.onclose = () => {
            console.log("❌ WebSocket Disconnected");
            setIsConnected(false);
            setSocket(null);
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

        socketRef.current = ws;
    };

    const disconnect = () => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    };

    const sendMessage = (message) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(message));
        } else {
            console.warn("WebSocket not connected. Cannot send:", message);
        }
    };

    return (
        <WebSocketContext.Provider value={{ socket, isConnected, lastMessage, sendMessage }}>
            {children}
        </WebSocketContext.Provider>
    );
};
