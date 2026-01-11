import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { MicRounded, StopRounded } from '@mui/icons-material';

const VoiceInput = ({ onSpeechEnd, onLive, onListenStart, lang = 'en-US' }) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
       setSupported(false);
       return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setListening(true);
      if (onListenStart) onListenStart();
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      
      if (onLive && currentText) {
          onLive(currentText);
      }
      
      // If we have a final result, we could trigger onSpeechEnd, 
      // but usually we wait for stop. 
      // However, for single commands, final is good.
      // For dictation, we keep going.
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow permission in your browser settings.");
      }
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
        if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [lang, onLive, onListenStart]);

  const handleStart = () => {
    if (recognitionRef.current) {
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Start error:", e);
        }
    }
  };

  const handleStop = () => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
        // Native API doesn't give "final" transcript on stop easily if it wasn't final yet,
        // but onresult handles live updates.
        // We can manually trigger onSpeechEnd with whatever we have if we tracked it, 
        // but since we blindly stream to onLive, the parent has the text.
        // onSpeechEnd is legacy; let's just ensure we stop.
    }
  };

  if (!supported) {
     return (
        <Tooltip title="Browser not supported">
             <IconButton color="error" disabled><MicRounded /></IconButton>
        </Tooltip>
     );
  }

  return (
    <Tooltip title={listening ? "Listening... Click to stop" : "Click to speak"}>
        <IconButton 
            color={listening ? "error" : "primary"} 
            onClick={listening ? handleStop : handleStart}
            sx={{ animation: listening ? 'pulse 1.5s infinite' : 'none' }}
        >
            {listening ? <StopRounded /> : <MicRounded />}
        </IconButton>
    </Tooltip>
  );
};

export default VoiceInput;
