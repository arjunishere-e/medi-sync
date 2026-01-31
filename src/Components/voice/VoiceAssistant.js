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
  X
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
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <Button
          size="lg"
          className={`rounded-full h-14 w-14 shadow-lg ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
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
                    <div className="p-2 rounded-lg bg-blue-50">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
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
                  <Button
                    size="lg"
                    className={`rounded-full h-12 w-12 ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : isListening ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
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