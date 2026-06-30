'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2, Loader2, MessageSquare, BrainCircuit } from 'lucide-react';
import { aiApi } from '@/lib/api';

// Supported Languages
const LANGUAGES = [
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'hi-IN', label: 'हिंदी (Hindi)' },
  { code: 'en-IN', label: 'English' },
];

export default function VoiceAgronomistFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0].code); // Default Marathi
  const [thinkingIdx, setThinkingIdx] = useState(0);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const THINKING_MESSAGES = [
    "Analyzing crop data...",
    "Consulting agronomist knowledge...",
    "Finding the best solution...",
  ];

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setThinkingIdx(prev => (prev + 1) % THINKING_MESSAGES.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  useEffect(() => {
    // Initialize Web Speech APIs
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
          
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }, 3000); // Wait 3 seconds of silence before processing
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
      
      synthesisRef.current = window.speechSynthesis;
      
      // Force loading of voices
      if (synthesisRef.current.onvoiceschanged !== undefined) {
        synthesisRef.current.onvoiceschanged = () => {
          synthesisRef.current?.getVoices();
        };
      }
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthesisRef.current) synthesisRef.current.cancel();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Update language dynamically
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  // When listening stops and we have a transcript, send it to the backend
  useEffect(() => {
    if (!isListening && transcript && transcript.length > 2 && !isProcessing && !response) {
      handleAskAI(transcript);
    }
  }, [isListening, transcript]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResponse('');
      
      // Prime the speech synthesis engine to unlock audio in browsers (must happen on user interaction)
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
        const prime = new SpeechSynthesisUtterance('');
        prime.volume = 0;
        synthesisRef.current.speak(prime);
        synthesisRef.current.resume(); // Ensure it isn't paused
      }
      
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Could not start listening', err);
      }
    }
  };

  const handleAskAI = async (text: string) => {
    setIsProcessing(true);
    try {
      // Find the English name for the prompt
      const langLabel = LANGUAGES.find(l => l.code === language)?.label || 'Marathi';
      const cleanLangName = langLabel.split(' ')[0]; // Just pass "Marathi", "Hindi", "English"

      const res = await aiApi.askVoiceAgronomist(text, cleanLangName);
      const answer = res.data.data.response;
      setResponse(answer);
      
      speakResponse(answer, language);
    } catch (err) {
      console.error('Failed to get answer', err);
      setResponse('क्षमस्व, तांत्रिक अडचण आली आहे. (Sorry, there was an error.)');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string, langCode: string) => {
    if (!synthesisRef.current) return;
    
    synthesisRef.current.cancel(); // Stop current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Attempt to find a high-quality native voice for the selected language
    const voices = synthesisRef.current.getVoices();
    const shortLang = langCode.split('-')[0].toLowerCase(); // e.g., 'mr', 'hi', 'en'
    
    let specificVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith(shortLang) && 
      (v.name.includes('Google') || v.name.includes('Online') || v.name.includes('Neural'))
    );
    
    if (!specificVoice) {
      specificVoice = voices.find(v => v.lang.toLowerCase().startsWith(shortLang));
    }
    
    if (specificVoice) {
      utterance.voice = specificVoice;
    }

    // Force resume in case the browser paused it
    synthesisRef.current.resume();
    synthesisRef.current.speak(utterance);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (recognitionRef.current) recognitionRef.current.abort();
    if (synthesisRef.current) synthesisRef.current.cancel();
    setTranscript('');
    setResponse('');
    setIsListening(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button
          drag
          dragMomentum={false}
          style={{ touchAction: 'none' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center gap-2 group"
        >
          <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:block font-medium">Kisan Mitra</span>
        </motion.button>
      )}

      {/* Chat Interface Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 w-[calc(100vw-3rem)] sm:w-[380px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-green-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Kisan Mitra (AI)</h3>
              </div>
              <button onClick={handleClose} className="p-1 hover:bg-green-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 h-[350px] max-h-[50vh] overflow-y-auto">
              {/* Language Selector */}
              <div className="flex justify-center mb-2">
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-green-500"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              {/* Chat History */}
              <div className="flex-1 flex flex-col gap-3 justify-end pb-2">
                {!transcript && !response && (
                  <div className="text-center text-slate-500 dark:text-slate-400 text-sm mt-10">
                    <Mic className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    Tap the mic and ask your question...
                  </div>
                )}

                {transcript && (
                  <div className="bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 p-3 rounded-2xl rounded-tr-sm self-end max-w-[85%] text-sm shadow-sm">
                    {transcript}
                  </div>
                )}
                
                {isProcessing && (
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm self-start max-w-[85%] text-sm flex items-center gap-3 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ rotate: { repeat: Infinity, duration: 4, ease: "linear" }, scale: { repeat: Infinity, duration: 1.5 } }}
                    >
                      <BrainCircuit className="w-5 h-5 text-emerald-600" />
                    </motion.div>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={thinkingIdx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-emerald-700 dark:text-emerald-400 font-medium"
                      >
                        {THINKING_MESSAGES[thinkingIdx]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}

                {response && (
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm self-start max-w-[90%] text-sm text-slate-800 dark:text-slate-200 shadow-sm relative group">
                    {response}
                    <button 
                      onClick={() => speakResponse(response, language)}
                      className="absolute -right-2 -bottom-2 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md text-green-600 hover:text-green-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mic Controls */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={toggleListen}
                className={`relative p-4 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200 shadow-inner' 
                    : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg'
                }`}
              >
                {isListening ? (
                  <div className="flex items-center justify-center gap-1 w-6 h-6">
                    <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-red-500 rounded-full" />
                    <motion.div animate={{ height: ["60%", "120%", "60%"] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-1 bg-red-500 rounded-full" />
                    <motion.div animate={{ height: ["30%", "80%", "30%"] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-1 bg-red-500 rounded-full" />
                    <motion.div animate={{ height: ["50%", "100%", "50%"] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.45 }} className="w-1 bg-red-500 rounded-full" />
                  </div>
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
