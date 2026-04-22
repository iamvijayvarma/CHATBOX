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
  const [chatMode, setChatMode] = useState('NORMAL'); // 'NORMAL' or 'PRO'
  
  // Separate session states for Normal and Pro
  const [normalSessions, setNormalSessions] = useState(() => {
    const saved = localStorage.getItem('chat_sessions_normal');
    return saved ? JSON.parse(saved) : [{ id: 'normal-1', messages: [], title: 'New Chat', date: new Date().toISOString() }];
  });
  
  const [proSessions, setProSessions] = useState(() => {
    const saved = localStorage.getItem('chat_sessions_pro');
    return saved ? JSON.parse(saved) : [{ id: 'pro-1', messages: [], title: 'New Pro Chat', date: new Date().toISOString() }];
  });

  const sessions = chatMode === 'PRO' ? proSessions : normalSessions;
  const setSessions = chatMode === 'PRO' ? setProSessions : setNormalSessions;

  const [currentSessionId, setCurrentSessionId] = useState(chatMode === 'PRO' ? 'pro-1' : 'normal-1');
  const [input, setInput] = useState('');
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;

  const { sendMessage, isLoading, isSearching, abortController, setAbortController, setIsLoading } = useChat();
  
  // Connect Voice Control to handlesubmit
  const { isListening, toggleListening, isSpeaking, speakText, stopSpeaking } = useVoiceControl((text) => {
    setInput(text);
    handleSubmit(text);
  });
  
  const [speakingText, setSpeakingText] = useState(null);

  // Sync Logic
  useEffect(() => {
    localStorage.setItem(`chat_sessions_${chatMode.toLowerCase()}`, JSON.stringify(sessions));
    
    // Auto-save PRO history to server if logged in
    if (chatMode === 'PRO' && user?.email) {
      fetch('/api/history/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, sessions })
      }).catch(err => console.error("History sync error:", err));
    }
  }, [sessions, chatMode, user]);

  // Load PRO history on login
  useEffect(() => {
    if (user?.email && chatMode === 'PRO') {
      fetch(`/api/history/load?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.sessions.length > 0) {
            setProSessions(data.sessions);
            setCurrentSessionId(data.sessions[0].id);
          }
        })
        .catch(err => console.error("History load error:", err));
    }
  }, [user, chatMode]);

  const handleNewChat = () => {
    const newSession = {
      id: `${chatMode.toLowerCase()}-${Date.now().toString()}`,
      messages: [],
      title: 'New Chat',
      date: new Date().toISOString()
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const handleDeleteSession = (id) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        return [{ id: `${chatMode.toLowerCase()}-${Date.now().toString()}`, messages: [], title: 'New Chat', date: new Date().toISOString() }];
      }
      return filtered;
    });
    
    setSessions(prev => {
      if (currentSessionId === id && prev.length > 0) {
        setCurrentSessionId(prev[0].id);
      }
      return prev;
    });
  };

  const handleClearSessions = () => {
    const freshSession = {
      id: `${chatMode.toLowerCase()}-${Date.now().toString()}`,
      messages: [],
      title: 'New Chat',
      date: new Date().toISOString()
    };
    setSessions([freshSession]);
    setCurrentSessionId(freshSession.id);
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
      await sendMessage(text, messages, (chunk) => {
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

  useEffect(() => { 
    if (!isSpeaking) {
      setSpeakingText(null);
    }
  }, [isSpeaking]);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID; 
  const isAuthEnabled = Boolean(GOOGLE_CLIENT_ID);

  const content = (
    <div className="flex h-screen h-[100dvh] w-screen bg-[#0a0c10] text-[#e2e8f0] font-sans relative overflow-hidden transition-colors duration-1000">
      
      {/* Mobile Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 z-[60] md:hidden flex items-center px-4 bg-[#0a0c10]/40 backdrop-blur-md border-b border-white/5">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all shadow-md mr-4 active:scale-95"
          aria-label="Open Menu"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Optimized Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <img 
          src={liquidBg} 
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity scale-110" 
          alt="" 
          style={{ willChange: 'transform' }}
        />
        <div className="absolute inset-0 bg-[#0a0c10]/80" />
        
        {!isMobile && (
          <>
            <motion.div 
              animate={{ background: 'radial-gradient(circle, #0ea5e922 0%, transparent 70%)' }}
              transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
              className="ambient-blob w-[600px] h-[600px] top-[-10%] left-[-10%]" 
            />
            <motion.div 
              animate={{ background: 'radial-gradient(circle, #0369a122 0%, transparent 70%)' }}
              transition={{ duration: 4, ease: "easeInOut", delay: 0.5, repeat: Infinity, repeatType: "mirror" }}
              className="ambient-blob w-[500px] h-[500px] bottom-[-20%] right-[-10%]" 
            />
            <motion.div 
              animate={{ background: 'radial-gradient(circle, #3b82f622 0%, transparent 70%)' }}
              transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
              className="ambient-blob w-[800px] h-[800px] top-[20%] left-[30%]" 
            />
          </>
        )}
      </div>

      <div className="flex h-full w-full relative">
        <Sidebar 
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewChat={(...args) => { handleNewChat(...args); setIsSidebarOpen(false); }}
          onDeleteSession={handleDeleteSession}
          onClearSessions={handleClearSessions}
          onExport={handleExport}
          user={user}
          setUser={setUser}
          isAuthEnabled={isAuthEnabled}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          chatMode={chatMode}
          setChatMode={setChatMode}
        />
        
        <main className={`flex-1 flex flex-col h-full relative border-l border-white/5 bg-gradient-to-b from-transparent to-[#0a0c10]/60 ${!isMobile ? 'backdrop-blur-[2px]' : ''}`}>
          <ChatWindow 
            messages={messages} 
            onSpeak={handleSpeak}
            onStopSpeak={handleStopSpeak}
            speakingText={speakingText}
            onQuickAction={handleSubmit}
            isSearching={isSearching}
          />
          
          <div className="pt-6 md:pt-12 pb-2 md:pb-3 shrink-0 z-20 absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/95 to-transparent">
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

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ""}>
      {content}
    </GoogleOAuthProvider>
  );
}

export default App;
