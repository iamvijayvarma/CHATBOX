import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { useChat } from './hooks/useChat';
import { useVoiceControl } from './hooks/useVoiceControl';
import logo from './assets/logo.png';
import liquidBg from './assets/liquid-bg.png';
import { motion } from 'framer-motion';

function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('chat_sessions');
    return saved ? JSON.parse(saved) : [{ id: '1', messages: [], title: 'New Chat', date: new Date().toISOString() }];
  });
  const [currentSessionId, setCurrentSessionId] = useState('1');
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  const { sendMessage, isLoading, abortController, setAbortController, setIsLoading } = useChat();
  
  // Connect Voice Control to handlesubmit
  const { isListening, toggleListening, isSpeaking, speakText, stopSpeaking } = useVoiceControl((text) => {
    setInput(text);
    handleSubmit(text);
  });
  
  const [speakingText, setSpeakingText] = useState(null);

  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const handleNewChat = () => {
    const newSession = {
      id: Date.now().toString(),
      messages: [],
      title: 'New Chat',
      date: new Date().toISOString()
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (id) => {
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      handleNewChat();
    } else {
      setSessions(filtered);
      if (currentSessionId === id) setCurrentSessionId(filtered[0].id);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `dingo_chats_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleSubmit = async (quickPrompt = null) => {
    const text = quickPrompt || input;
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text };
    const updatedSessions = sessions.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: [...s.messages, userMessage], title: s.messages.length === 0 ? text.slice(0, 30) : s.title }
        : s
    );
    setSessions(updatedSessions);
    setInput('');

    try {
      const response = await sendMessage(text, messages, (chunk) => {
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const lastMsg = s.messages[s.messages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              return { ...s, messages: [...s.messages.slice(0, -1), { ...lastMsg, content: lastMsg.content + chunk }] };
            } else {
              return { ...s, messages: [...s.messages, { role: 'assistant', content: chunk }] };
            }
          }
          return s;
        }));
      });
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

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; 

  const isAuthEnabled = Boolean(GOOGLE_CLIENT_ID);
  if (!isAuthEnabled) {
    console.warn("VITE_GOOGLE_CLIENT_ID is missing. Google Login is disabled.");
  }

  const mainLayout = (
    <div className="flex h-screen w-screen bg-[#0a0c10] text-[#e2e8f0] font-sans relative overflow-hidden transition-colors duration-1000">
      
      {/* Mobile Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 z-50 md:hidden flex items-center px-4 bg-[#0a0c10]/40 backdrop-blur-md border-b border-white/5">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all shadow-md mr-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>
        </button>
        
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 p-0.5 shadow-lg shadow-indigo-500/10">
            <img src={logo} className="w-full h-full object-contain" alt="Logo" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white">DINGO AI</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Liquid Glass Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          src={liquidBg} 
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity scale-[1.05]" 
          alt="Base Texture" 
        />
        <div className="absolute inset-0 bg-[#0a0c10]/70" />
        
        <motion.div 
          animate={{ background: 'radial-gradient(circle, #0ea5e933 0%, transparent 70%)' }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="ambient-blob w-[600px] h-[600px] top-[-10%] left-[-10%]" 
        />
        <motion.div 
          animate={{ background: 'radial-gradient(circle, #0369a133 0%, transparent 70%)' }}
          transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
          className="ambient-blob w-[500px] h-[500px] bottom-[-20%] right-[-10%]" 
        />
        <motion.div 
          animate={{ background: 'radial-gradient(circle, #3b82f633 0%, transparent 70%)' }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="ambient-blob w-[800px] h-[800px] top-[20%] left-[30%]" 
        />
      </div>

      <div className="flex h-full w-full z-10 relative">
        <Sidebar 
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewChat={(...args) => { handleNewChat(...args); setIsSidebarOpen(false); }}
          onDeleteSession={handleDeleteSession}
          onExport={handleExport}
          user={user}
          setUser={setUser}
          isAuthEnabled={isAuthEnabled}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <main className="flex-1 flex flex-col h-full relative border-l border-white/5 bg-gradient-to-b from-transparent to-[#0a0c10]/60 backdrop-blur-[2px]">
          <ChatWindow 
            messages={messages} 
            onSpeak={handleSpeak}
            onStopSpeak={handleStopSpeak}
            speakingText={speakingText}
            onQuickAction={handleSubmit}
          />
          
          <div className="pt-12 pb-3 shrink-0 z-20 absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/95 to-transparent">
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

  return isAuthEnabled ? (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {mainLayout}
    </GoogleOAuthProvider>
  ) : (
    <>{mainLayout}</>
  );
}

export default App;
