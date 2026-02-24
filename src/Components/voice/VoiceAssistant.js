import React, { useState, useEffect, useRef } from 'react';
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Loader2,
  MessageCircle,
  X,
  Waveform
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '../../api/base44Client';

export default function VoiceAssistant({ onCommand, userRole }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const recognition = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        if (event.results[current].isFinal) {
          processCommand(transcript);
        }
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognition.current) {
      setTranscript('');
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const processCommand = async (command) => {
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: command }]);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a voice assistant for a hospital ward management system. The user is a ${userRole}.
        
User command: "${command}"

Analyze this command and respond with:
1. A brief, helpful response (max 2 sentences)
2. Any action to take

Common commands include:
- Check patient vitals
- Medicine schedule queries
- Alert status
- Patient information
- Lab report status
- Call for help

Respond in a friendly, professional manner suitable for healthcare.`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            action: { 
              type: "string",
              enum: ["none", "check_vitals", "check_medicine", "check_alerts", "view_patient", "view_labs", "call_help"]
            },
            patient_name: { type: "string" }
          }
        }
      });

      setResponse(result.response);
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      
      // Text-to-speech response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(result.response);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
      }

      if (result.action !== 'none' && onCommand) {
        onCommand(result.action, result.patient_name);
      }
    } catch (error) {
      console.error('Error processing command:', error);
      setResponse('Sorry, I could not process your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Animated ring background when listening */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400/30"
              animate={{ scale: [1, 1.4], opacity: [1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400/20"
              animate={{ scale: [1, 1.2], opacity: [1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center justify-center rounded-full h-16 w-16 font-semibold text-white shadow-lg transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-red-500/50'
              : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-blue-500/40 hover:shadow-blue-500/60'
          }`}
          style={{
            boxShadow: isListening 
              ? '0 0 20px rgba(239, 68, 68, 0.5), 0 10px 30px rgba(239, 68, 68, 0.3)'
              : '0 0 20px rgba(59, 130, 246, 0.4), 0 10px 30px rgba(59, 130, 246, 0.2)'
          }}
        >
          {/* Icon with animation */}
          <motion.div
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.6, repeat: isListening ? Infinity : 0 }}
          >
            {isListening ? (
              <MicOff className="h-7 w-7" />
            ) : (
              <Mic className="h-7 w-7" />
            )}
          </motion.div>

          {/* Recording indicator dot */}
          {isListening && (
            <motion.div
              className="absolute top-1 right-1 h-3 w-3 bg-white rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Voice assistant panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-80"
          >
            <Card className="shadow-2xl border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                      <Mic className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-semibold text-slate-900">Voice Assistant</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {messages.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      Tap the microphone to start speaking
                    </p>
                  )}
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`p-2 rounded-lg text-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-500 text-white ml-8' 
                          : 'bg-slate-100 text-slate-700 mr-8'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  )}
                </div>

                {/* Transcript */}
                {transcript && (
                  <div className="p-2 bg-slate-50 rounded-lg mb-4">
                    <p className="text-xs text-slate-500 mb-1">Listening...</p>
                    <p className="text-sm">{transcript}</p>
                  </div>
                )}

                {/* Controls */}
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing}
                    className={`rounded-full h-14 w-14 font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center ${
                      isListening
                        ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-red-500/40'
                        : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-blue-500/40 hover:shadow-blue-500/60'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isListening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </motion.button>
                </div>

                <p className="text-xs text-center text-slate-400 mt-3">
                  {isListening ? 'Listening... Speak now' : 'Tap to speak'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}