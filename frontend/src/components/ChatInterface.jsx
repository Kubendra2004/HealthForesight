import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, TextField, IconButton, Avatar, 
  List, ListItem, ListItemText, ListItemAvatar, Divider, CircularProgress 
} from '@mui/material';
import { SendRounded, CloseRounded, AttachFileRounded } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceInput from './VoiceInput';

const ChatInterface = ({ otherUser, onClose }) => {
  const { user, token } = useAuth();
  const { lastMessage, sendMessage } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const baseTextRef = useRef(""); // For voice input

  // Fetch History
  useEffect(() => {
    const targetId = otherUser?.username || otherUser?.id;
    if (!otherUser || !targetId || targetId === "undefined") {
        console.warn("ChatInterface: Invalid chat partner", otherUser);
        setLoading(false);
        return;
    }
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/history/${otherUser.username || otherUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          scrollToBottom();
        }
      } catch (e) {
        console.error("Failed to fetch chat history", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [otherUser, token]);

  // Real-time Listener
  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'new_message' || lastMessage.type === 'message_sent')) {
      const msg = lastMessage.data;
      // Check if message belongs to this conversation
      const isRelevant = 
        (msg.sender_id === otherUser.username && msg.receiver_id === user.username) ||
        (msg.sender_id === user.username && msg.receiver_id === otherUser.username);
      
      if (isRelevant) {
        setMessages(prev => {
            // Dedup based on ID if needed, but for now just append
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
        });
        scrollToBottom();
      }
    }
  }, [lastMessage, otherUser, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const payload = {
        sender_id: user.username,
        receiver_id: otherUser.username || otherUser.id, // Support object or ID
        content: newMessage,
        type: 'text'
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/messages/send`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNewMessage('');
        // Optimistic update handled by WebSocket 'message_sent' event usually, 
        // but can also append here if latency is high. 
        // We relying on WS 'message_sent' for now.
      }
    } catch (e) {
      console.error("Send failed", e);
    }
  };

  return (
    <Paper 
      elevation={10}
      sx={{ 
        position: 'fixed', bottom: 20, right: 20, 
        width: 350, height: 500, zIndex: 1400,
        display: 'flex', flexDirection: 'column',
        borderRadius: 4, overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
            {otherUser.username?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
                {otherUser.username || otherUser.id}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Online
            </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'white' }}>
            <CloseRounded />
        </IconButton>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f5f5f5' }}>
        {loading ? (
            <Box display="flex" justifyContent="center" mt={4}><CircularProgress size={24} /></Box>
        ) : (
            <List>
                {messages.map((msg, index) => {
                    const isMe = msg.sender_id === user.username;
                    return (
                        <ListItem key={index} sx={{ justifyContent: isMe ? 'flex-end' : 'flex-start', mb: 1 }}>
                             <Box sx={{ 
                                maxWidth: '75%', 
                                bgcolor: isMe ? 'primary.light' : 'white',
                                color: isMe ? 'white' : 'text.primary',
                                p: 1.5, borderRadius: 2,
                                borderTopRightRadius: isMe ? 0 : 2,
                                borderTopLeftRadius: isMe ? 2 : 0,
                                boxShadow: 1
                             }}>
                                <Typography variant="body2">{msg.content}</Typography>
                                <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.7, fontSize: '0.65rem' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                             </Box>
                        </ListItem>
                    );
                })}
                <div ref={messagesEndRef} />
            </List>
        )}
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee', display: 'flex' }}>
        <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            sx={{ mr: 1 }}
        />
        <VoiceInput 
            onListenStart={() => {
                baseTextRef.current = newMessage; // Capture existing text
            }}
            onLive={(liveText) => {
                // Update input with (Base + Space + LiveText)
                const prefix = baseTextRef.current ? baseTextRef.current + " " : "";
                setNewMessage(prefix + liveText);
            }}
            onSpeechEnd={(finalText) => {
                // Finalize
                const prefix = baseTextRef.current ? baseTextRef.current + " " : "";
                setNewMessage(prefix + finalText);
            }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!newMessage.trim()}>
            <SendRounded />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatInterface;
