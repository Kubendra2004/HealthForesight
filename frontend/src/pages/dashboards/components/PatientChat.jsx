import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { DeleteSweep, Info, Person, Send, SmartToy } from '@mui/icons-material';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';

import VoiceInput from '../../../components/VoiceInput';
import { useAuth } from '../../../context/AuthContext';

const WELCOME_MESSAGE = {
  id: 'welcome',
  text: "Hello! I'm your AI Health Assistant. I can use your profile, vitals, medical history, prescriptions, and recent health signals to give more fitting answers.",
  sender: 'ai',
  timestamp: new Date().toISOString(),
};

const PatientChat = ({ patientId }) => {
  const { token } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const baseInputRef = useRef('');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const storageKey = `patient_chat_history_${patientId}`;

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  useEffect(() => {
    if (!patientId) {
      setMessages([WELCOME_MESSAGE]);
      return;
    }

    const savedMessages = localStorage.getItem(storageKey);
    if (!savedMessages) {
      setMessages([WELCOME_MESSAGE]);
      return;
    }

    try {
      const parsed = JSON.parse(savedMessages);
      setMessages(Array.isArray(parsed) && parsed.length > 0 ? parsed : [WELCOME_MESSAGE]);
    } catch (error) {
      console.error('Failed to parse chat history', error);
      setMessages([WELCOME_MESSAGE]);
    }
  }, [patientId, storageKey]);

  useEffect(() => {
    if (patientId && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages, patientId, storageKey]);

  const handleClearChat = () => {
    const confirmClear = window.confirm('Are you sure you want to clear the chat history on this device?');
    if (!confirmClear) {
      return;
    }

    const resetMessage = {
      id: `reset-${Date.now()}`,
      text: 'Chat history cleared on this device. Your next messages will rebuild the conversation context.',
      sender: 'ai',
      timestamp: new Date().toISOString(),
    };

    setMessages([resetMessage]);
    localStorage.removeItem(storageKey);
  };

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    if (!patientId || !token) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: 'Your session is missing authentication details. Please sign in again.',
          sender: 'ai',
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
      return;
    }

    const userMsg = {
      id: `user-${Date.now()}`,
      text: input.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        `${apiUrl}/chatbot/ask`,
        {
          query: userMsg.text,
          consent: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const aiMsg = {
        id: `ai-${Date.now()}`,
        text: res.data.response,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        metadata: {
          context_used: res.data.context_used,
          rag_used: res.data.rag_used,
          sources: res.data.sources || [],
        },
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      let errorText = "I'm having trouble connecting to the assistant right now.";

      if (error.response?.status === 401) {
        errorText = 'Your login session expired. Please sign in again.';
      } else if (error.response?.status === 403) {
        errorText = 'This chatbot is currently available only for authenticated patient accounts.';
      } else if (error.response?.status === 404) {
        errorText = 'Chat service not found.';
      } else if (error.response?.status === 500) {
        errorText = 'The assistant hit an internal error. Please try again shortly.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: errorText,
          sender: 'ai',
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateInput) => {
    const date = new Date(dateInput);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        height: 'calc(100vh - 200px)',
        maxHeight: 'calc(100vh - 200px)',
        minHeight: '540px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'linear-gradient(135deg, #f7fffd 0%, #ecfeff 34%, #eef4ff 100%)',
          borderRadius: '22px',
          padding: '1rem 1.25rem',
          border: '1px solid #d9efe9',
          boxShadow: '0 14px 35px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '12px', display: 'grid', placeItems: 'center', bgcolor: '#0f766e', color: 'white', boxShadow: '0 10px 20px rgba(15,118,110,0.18)' }}>
              <SmartToy fontSize="small" />
            </Box>
            <Typography sx={{ fontSize: '1.55rem', lineHeight: 1, fontWeight: 800, color: '#10243e' }}>
              AI Health Support
            </Typography>
          </Box>
          <Typography sx={{ color: '#50627a', fontSize: '0.9rem', maxWidth: '780px' }}>
            Personalized answers using your authenticated medical profile, vitals, prescriptions, history, and protocol retrieval.
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
            <Chip size="small" label="Profile-aware" sx={{ bgcolor: '#e7f8f5', color: '#0f5f59', fontWeight: 700 }} />
            <Chip size="small" label="Vitals-aware" sx={{ bgcolor: '#eaf2ff', color: '#2447a8', fontWeight: 700 }} />
            <Chip size="small" label="Protocol-backed" sx={{ bgcolor: '#f2efff', color: '#5a3bb8', fontWeight: 700 }} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            size="small"
            label="Personalized mode on"
            sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }}
          />
          <Tooltip title="Clear chat history on this device">
            <IconButton onClick={handleClearChat} sx={{ color: '#31557d', bgcolor: '#eef4ff', '&:hover': { bgcolor: '#dde9ff' } }}>
              <DeleteSweep />
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>

      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '24px',
          border: '1px solid #dbe7f2',
          overflow: 'hidden',
          bgcolor: '#f8fbff',
          boxShadow: '0 18px 38px rgba(15, 23, 42, 0.08)'
        }}
      >
        <Box
          sx={{
            flexGrow: 1,
            minHeight: 0,
            overflowY: 'auto',
            px: { xs: 2, md: 3 },
            py: 3,
            bgcolor: '#f8fbff',
            backgroundImage: 'radial-gradient(#dbe4f0 1px, transparent 1px)',
            backgroundSize: '18px 18px'
          }}
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '1.4rem'
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 1.25,
                    maxWidth: '88%'
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: msg.sender === 'user' ? '#0f766e' : '#2563eb',
                      width: 42,
                      height: 42,
                      boxShadow: '0 8px 18px rgba(15,23,42,0.12)'
                    }}
                  >
                    {msg.sender === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2.25,
                        py: 1.75,
                        borderRadius: '20px',
                        borderTopRightRadius: msg.sender === 'user' ? '6px' : '20px',
                        borderTopLeftRadius: msg.sender === 'ai' ? '6px' : '20px',
                        bgcolor: msg.sender === 'user' ? '#0f766e' : '#ffffff',
                        color: msg.sender === 'user' ? '#f8fffd' : '#1e293b',
                        border: msg.sender === 'user' ? '1px solid #0d9488' : '1px solid #dde7f2',
                        boxShadow: msg.sender === 'user'
                          ? '0 16px 28px rgba(15,118,110,0.24)'
                          : '0 12px 24px rgba(15,23,42,0.06)'
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', color: 'inherit' }}>
                        {msg.text}
                      </Typography>

                      {msg.metadata?.sources?.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                          {msg.metadata.sources.map((source) => (
                            <Chip
                              key={`${msg.id}-${source.title}`}
                              size="small"
                              label={source.title}
                              variant="outlined"
                              sx={{
                                borderColor: '#d5deea',
                                bgcolor: '#f8fbff',
                                color: '#43526b'
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Paper>

                    <Box sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', alignItems: 'center', mt: 0.7, px: 0.5, gap: 0.9, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: '#8a9ab0', fontSize: '0.76rem' }}>
                        {formatTime(msg.timestamp)}
                      </Typography>

                      {msg.metadata?.rag_used && (
                        <Tooltip title="Protocol-backed answer">
                          <Info sx={{ fontSize: 14, color: '#64748b', cursor: 'help' }} />
                        </Tooltip>
                      )}

                    </Box>
                  </Box>
                </Box>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                key="loading-indicator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}
              >
                <Box sx={{ bgcolor: 'white', px: 3, py: 2, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid #e2e8f0', boxShadow: '0 10px 20px rgba(15,23,42,0.05)' }}>
                  <CircularProgress size={16} sx={{ color: '#0f766e' }} />
                  <Typography variant="body2" color="text.secondary" fontWeight="600">AI is analyzing your health context...</Typography>
                </Box>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </AnimatePresence>
        </Box>

        <Box
          sx={{
            p: 2.25,
            borderTop: '1px solid #e3ebf4',
            bgcolor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            bottom: 0,
            zIndex: 2
          }}
        >
          <Box sx={{ mb: 1.4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
              This assistant automatically uses your saved health context for better answers.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 1.5,
              alignItems: 'center'
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask about symptoms, vitals, trends, appointments, or your recent health profile..."
              variant="outlined"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '18px',
                  bgcolor: '#ffffff',
                  minHeight: 60,
                  transition: 'all 0.2s',
                  '& fieldset': { borderColor: '#d8e3ef' },
                  '&:hover fieldset': { borderColor: '#b7c8da' },
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.10)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4f8df7'
                  }
                },
                '& .MuiInputBase-input': {
                  py: 2,
                  fontSize: '1rem'
                }
              }}
            />

            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '16px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#eef4ff',
                border: '1px solid #d6e2f3'
              }}
            >
              <VoiceInput
                onListenStart={() => {
                  baseInputRef.current = input;
                }}
                onLive={(liveText) => {
                  const prefix = baseInputRef.current ? `${baseInputRef.current} ` : '';
                  setInput(prefix + liveText);
                }}
                onSpeechEnd={(finalText) => {
                  const prefix = baseInputRef.current ? `${baseInputRef.current} ` : '';
                  setInput(prefix + finalText);
                }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              sx={{
                borderRadius: '18px',
                minWidth: 64,
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #2563eb 0%, #0f766e 100%)',
                boxShadow: '0 16px 26px rgba(37, 99, 235, 0.25)',
                '&:hover': { background: 'linear-gradient(135deg, #1d4ed8 0%, #0d5f59 100%)' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : <Send />}
            </Button>
          </Box>

          <Typography variant="caption" align="center" display="block" sx={{ mt: 1.35, color: '#8a9ab0' }}>
            Disclaimer: This AI provides educational support only. For emergencies, contact local emergency services immediately.
          </Typography>
        </Box>
      </Paper>
    </motion.div>
  );
};

export default PatientChat;
