import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { chatStorage } from './services/chatStorage';
import { useVoiceControl } from './hooks/useVoiceControl';
import liquidBg from './assets/liquid-bg.png';

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
    'Assistant': { primary: '#312e8166', accent: '#1e1b4b66' },
    'Coder Wizard': { primary: '#1e3a8a66', accent: '#17255466' },
    'Creative Writer': { primary: '#581c8766', accent: '#2e106566' }
  };

  const currentColors = personaColors[persona] || personaColors['Assistant'];

  return (
    <div className="flex h-screen w-screen bg-black text-slate-100 font-sans relative overflow-hidden">
      
      {/* Liquid Glass Background Logic */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          src={liquidBg} 
          className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen scale-[1.05]" 
          alt="Base Texture" 
        />
        <div className="absolute inset-0 bg-[#020617]/60" /> {/* Dark overlay to Blend */}
        
        <motion.div 
          animate={{ background: `radial-gradient(circle, ${currentColors.primary} 0%, transparent 70%)` }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="ambient-blob w-[600px] h-[600px] top-[-10%] left-[-10%]" 
        />
        <motion.div 
          animate={{ background: `radial-gradient(circle, ${currentColors.accent} 0%, transparent 70%)` }}
          transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
          className="ambient-blob w-[500px] h-[500px] bottom-[-20%] right-[-10%]" 
        />
        <motion.div 
          animate={{ background: `radial-gradient(circle, #3b82f633 0%, transparent 70%)` }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="ambient-blob w-[800px] h-[800px] top-[20%] left-[30%]" 
        />
      </div>
      
      {/* Liquid SVG Filter Registry */}
      <svg className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

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
        
        <main className="flex-1 flex flex-col h-full relative border-l border-white/5 bg-gradient-to-b from-transparent to-[#020617]/40 backdrop-blur-[2px]">
          <ChatWindow 
            messages={messages} 
            onSpeak={handleSpeak}
            onStopSpeak={handleStopSpeak}
            speakingText={speakingText}
            onQuickAction={handleSubmit}
          />
          
          <div className="pt-12 pb-6 shrink-0 z-20 absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent">
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
