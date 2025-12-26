import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  CircularProgress,
  Avatar,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import { Send, SmartToy, Person, DeleteSweep, Info } from '@mui/icons-material';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const PatientChat = ({ patientId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Load history from local storage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_history_${patientId}`);
    if (savedMessages) {
        try {
            setMessages(JSON.parse(savedMessages));
        } catch (e) {
            console.error("Failed to parse chat history", e);
        }
    } else {
        // Initial welcome message if no history
        setMessages([
            {
              id: 1,
              text: "Hello! I'm your AI Health Assistant. How can I help you today? I can assist with appointments, general health questions, and checking your latest vitals if you provide consent.",
              sender: 'ai',
              timestamp: new Date()
            }
        ]);
    }
  }, [patientId]);

  // Save history to local storage whenever messages change
  useEffect(() => {
    if (messages.length > 0 && patientId) {
        localStorage.setItem(`chat_history_${patientId}`, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages, patientId]);

  const handleClearChat = () => {
      const confirmClear = window.confirm("Are you sure you want to clear the chat history?");
      if (confirmClear) {
          setMessages([
            {
              id: Date.now(),
              text: "Chat history cleared. How can I help you now?",
              sender: 'ai',
              timestamp: new Date()
            }
          ]);
          localStorage.removeItem(`chat_history_${patientId}`);
      }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!patientId) {
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: "Error: User ID not found. Please try refreshing.",
            sender: 'ai',
            isError: true,
            timestamp: new Date()
        }]);
        return;
    }

    const userMsg = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/chatbot/ask', {
        patient_id: String(patientId),
        query: userMsg.text,
        consent: consent
      });

      const aiMsg = {
        id: Date.now() + 1,
        text: res.data.response,
        sender: 'ai',
        timestamp: new Date(),
        metadata: {
          context_used: res.data.context_used,
          rag_used: res.data.rag_used
        }
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting to the server. Please try again later.",
        sender: 'ai',
        isError: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to format time safely (handling string dates from JSON)
  const formatTime = (dateInput) => {
      const date = new Date(dateInput);
      return isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
        {/* Header Section */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                borderRadius: "16px",
                padding: "1.5rem 2rem",
                marginBottom: "1.5rem",
                color: "white",
                boxShadow: "0 10px 40px rgba(99, 102, 241, 0.3)",
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}
        >
            <Box>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem", display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <SmartToy fontSize="large" /> AI Health Support
                </h1>
                <p style={{ fontSize: "0.95rem", opacity: 0.9, margin: 0 }}>
                    Your 24/7 personal health companion
                </p>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(10px)', border: 'none', borderRadius: 3 }}>
                    <CardContent sx={{ py: 1, '&:last-child': { pb: 1 }, px: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={consent} 
                                    onChange={(e) => setConsent(e.target.checked)} 
                                    sx={{ 
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: '#fbbf24' }, 
                                        '& .MuiSwitch-track': { backgroundColor: 'white' } 
                                    }}
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Allow Data Access</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>See vitals & history</Typography>
                                </Box>
                            }
                        />
                    </CardContent>
                </Card>
                <Tooltip title="Clear Chat History">
                    <IconButton onClick={handleClearChat} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                        <DeleteSweep />
                    </IconButton>
                </Tooltip>
            </Box>
        </motion.div>

        {/* Chat Area */}
        <Paper 
            elevation={0} 
            sx={{ 
                flexGrow: 1,
                height: '70vh', // Fixed height for consistency
                display: 'flex', 
                flexDirection: 'column', 
                borderRadius: 4, 
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                bgcolor: '#fff',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
        >
            {/* Messages */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, bgcolor: '#f8fafc', backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            style={{
                                display: 'flex',
                                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                                alignItems: 'flex-start',
                                maxWidth: '85%'
                            }}>
                                <Avatar 
                                    sx={{ 
                                        bgcolor: msg.sender === 'user' ? '#3b82f6' : '#8b5cf6',
                                        width: 36, height: 36, mx: 1.5,
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    {msg.sender === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                                </Avatar>
                                
                                <Box>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2.5,
                                            borderRadius: 3,
                                            borderTopRightRadius: msg.sender === 'user' ? 0 : 20,
                                            borderTopLeftRadius: msg.sender === 'ai' ? 0 : 20,
                                            bgcolor: msg.sender === 'user' ? '#3b82f6' : 'white',
                                            color: msg.sender === 'user' ? 'white' : '#1e293b',
                                            boxShadow: msg.sender === 'ai' ? '0 4px 15px rgba(0,0,0,0.05)' : '0 4px 15px rgba(59, 130, 246, 0.4)',
                                            border: msg.sender === 'ai' ? '1px solid #e2e8f0' : 'none'
                                        }}
                                    >
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                            {msg.text}
                                        </Typography>
                                    </Paper>
                                    <Box sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'center', mt: 0.5, px: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                            {formatTime(msg.timestamp)}
                                        </Typography>
                                        {msg.metadata && msg.metadata.rag_used && (
                                            <Tooltip title="Information retrieved from medical guidelines">
                                                <Info sx={{ fontSize: 14, color: '#64748b', ml: 1, cursor: 'help' }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </motion.div>
                    ))}
                    {loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem', paddingLeft: '4.5rem' }}>
                           <Box sx={{ bgcolor: 'white', px: 3, py: 2, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                                <CircularProgress size={16} sx={{ color: '#8b5cf6' }} />
                                <Typography variant="body2" color="text.secondary" fontWeight="600">AI is analyzing...</Typography>
                           </Box>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </AnimatePresence>
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        placeholder="Type your health question (e.g. 'What are the symptoms of flu?')..."
                        variant="outlined"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        sx={{ 
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                                bgcolor: '#f8fafc',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: '#f1f5f9' },
                                '&.Mui-focused': { bgcolor: 'white', boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)' }
                            }
                        }}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        sx={{ 
                            borderRadius: 3, 
                            minWidth: '60px', 
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : <Send />}
                    </Button>
                </Box>
                <Typography variant="caption" align="center" display="block" sx={{ mt: 1.5, color: '#94a3b8' }}>
                    ⚠️ Disclaimer: This AI provides information for educational purposes only. For medical emergencies, call emergency services.
                </Typography>
            </Box>
        </Paper>
    </motion.div>
  );
};

export default PatientChat;
