import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { chatStorage } from './services/chatStorage';
import { useVoiceControl } from './hooks/useVoiceControl';

function App() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [speakingText, setSpeakingText] = useState(null);
  const [persona, setPersona] = useState('Assistant');

  const { isListening, toggleListening, isSpeaking, speakText, stopSpeaking } = useVoiceControl((text) => {
    setInput((prev) => prev + (prev ? ' ' : '') + text);
  });

  useEffect(() => {
    const loadedSessions = chatStorage.getSessions();
    setSessions(loadedSessions);
    if (loadedSessions.length > 0) {
      setCurrentSessionId(loadedSessions[0].id);
    } else {
      handleNewChat();
    }
  }, []);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const handleNewChat = () => {
    const newSession = chatStorage.createSession();
    setSessions(chatStorage.getSessions());
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (id) => {
    const newSessions = chatStorage.deleteSession(id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      setCurrentSessionId(newSessions.length > 0 ? newSessions[0].id : null);
      if (newSessions.length === 0) handleNewChat();
    }
  };

  const handleExport = (session) => chatStorage.exportChat(session, 'json');

  const handleImport = (jsonString) => {
    const newSession = chatStorage.importChat(jsonString);
    if (newSession) {
      setSessions(chatStorage.getSessions());
      setCurrentSessionId(newSession.id);
    } else {
      alert('Failed to import chat.');
    }
  };

  const handleSubmit = async (overrideInput = null) => {
    const finalInput = overrideInput || input;
    if (!finalInput.trim() || isLoading) return;

    let targetSessionId = currentSessionId;
    if (!currentSessionId) {
       const newSession = chatStorage.createSession();
       setSessions(chatStorage.getSessions());
       targetSessionId = newSession.id;
       setCurrentSessionId(targetSessionId);
    }

    const currentSess = chatStorage.getSessions().find(s => s.id === targetSessionId);

    const userMessage = { role: 'user', content: finalInput.trim() };
    const updatedMessages = [...currentSess.messages, userMessage];

    let titleUpdate = currentSess.title;
    if (currentSess.messages.length === 0) {
      titleUpdate = finalInput.trim().slice(0, 30) + '...';
    }

    chatStorage.updateSession(targetSessionId, { messages: updatedMessages, title: titleUpdate });
    setSessions(chatStorage.getSessions());
    if (!overrideInput) setInput('');
    setIsLoading(true);

    const ctrl = new AbortController();
    setAbortController(ctrl);

    const assistantMessage = { role: 'assistant', content: '' };
    updatedMessages.push(assistantMessage);

    chatStorage.updateSession(targetSessionId, { messages: updatedMessages });
    setSessions(chatStorage.getSessions());

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           messages: updatedMessages.slice(0, -1),
           persona 
        }),
        signal: ctrl.signal
      });

      if (!response.ok) throw new Error('API Error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let finalContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
           if (line.trim().startsWith('data: ')) {
             const dataStr = line.trim().substring(6);
             if (dataStr === '[DONE]') break;
             try {
                const data = JSON.parse(dataStr);
                if (data.content) {
                  finalContent += data.content;
                  updatedMessages[updatedMessages.length - 1].content = finalContent;
                  chatStorage.updateSession(targetSessionId, { messages: updatedMessages });
                  setSessions(chatStorage.getSessions());
                }
             } catch (e) { }
           }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.error("Chat streaming error:", error);
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  const handleSpeak = (text) => { setSpeakingText(text); speakText(text); };
  const handleStopSpeak = () => { setSpeakingText(null); stopSpeaking(); };

  useEffect(() => { if (!isSpeaking) setSpeakingText(null); }, [isSpeaking]);

  const personaColors = {
    'Assistant': { primary: '#334155', accent: '#1e293b' },
    'Coder Wizard': { primary: '#312e81', accent: '#1e1b4b' },
    'Creative Writer': { primary: '#581c87', accent: '#3b0764' }
  };

  const currentColors = personaColors[persona] || personaColors['Assistant'];

  return (
    <div className="flex h-screen w-screen bg-[#0a0c10] text-[#e2e8f0] font-sans relative overflow-hidden transition-colors duration-1000">
      
      {/* Liquid Water SVG Filter Registry */}
      <svg className="hidden">
        <defs>
          <filter id="liquid-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 45 -15" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
          <filter id="organic-edge">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" />
          </filter>
        </defs>
      </svg>

      {/* Liquid Water Background Engine */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ background: `radial-gradient(circle, ${currentColors.primary} 0%, transparent 70%)` }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="water-glob w-[900px] h-[900px] -top-[20%] -left-[10%]" 
        />
        <motion.div 
          animate={{ background: `radial-gradient(circle, ${currentColors.accent} 0%, transparent 70%)` }}
          transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
          className="water-glob w-[700px] h-[700px] -bottom-[10%] -right-[10%]" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f1115]/50 to-[#0f1115]" />
      </div>

      {/* Main Layout Overlay */}
      <div className="flex h-full w-full z-10 relative">
        <Sidebar 
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onExport={handleExport}
          onImport={handleImport}
          persona={persona}
          setPersona={setPersona}
        />
        
        <main className="flex-1 flex flex-col h-full relative border-l border-white/5 bg-[#0f1115]/30 backdrop-blur-[4px]">
          <ChatWindow 
            messages={messages} 
            onSpeak={handleSpeak}
            onStopSpeak={handleStopSpeak}
            speakingText={speakingText}
            onQuickAction={handleSubmit}
            persona={persona}
          />
          
          <div className="pt-12 pb-6 shrink-0 z-20 absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/80 to-transparent">
            <InputBar 
              input={input}
              setInput={setInput}
              onSubmit={() => handleSubmit()}
              isListening={isListening}
              toggleListening={toggleListening}
              isLoading={isLoading}
              abortController={abortController}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
