import { useGoogleLogin } from '@react-oauth/google';
import { Plus, MessageSquare, Trash2, Download, Upload, LogIn, LogOut, X } from 'lucide-react';

import logo from '../assets/logo.png';

function LoginSection({ isAuthEnabled, user, setUser }) {
  if (!isAuthEnabled) return null;

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const authRes = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenResponse.access_token })
        });
        
        const authData = await authRes.json();
        if (authData.success) {
          setUser(authData.user);
        } else {
          console.error("Auth verification failed:", authData.error);
        }
      } catch (err) {
        console.error("Google Auth Error:", err);
      }
    },
  });

  return (
    <div className="px-4 mb-6">
      {!user ? (
        <button 
          onClick={() => login()}
          className="w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white p-3.5 rounded-2xl border border-white/10 transition-all group overflow-hidden relative shadow-lg"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
            <LogIn size={18} className="text-sky-400" />
          </div>
          <div className="flex flex-col items-start translate-y-[1px]">
            <span className="text-[15px] font-bold tracking-tight">Log in</span>
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">With Google</span>
          </div>
        </button>
      ) : (
        <div className="w-full group/card bg-white/[0.02] p-3 rounded-2xl border border-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
              {user.avatar ? (
                <img src={user.avatar} className="w-10 h-10 rounded-full border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.3)]" alt="Avatar" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                  <span className="text-sky-400 font-bold">{user.name[0]}</span>
                </div>
              )}
              <div className="flex flex-col overflow-hidden flex-1">
                <span className="text-sm font-bold text-white truncate">{user.name}</span>
                <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
              </div>
              <button 
                onClick={() => setUser(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-red-400 transition-all"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onExport,
  user,
  setUser,
  isAuthEnabled,
  isOpen,
  onClose
}) {
  return (
    <div className={`
      fixed md:relative top-0 left-0 h-full w-72 glass-panel flex flex-col pt-4 z-50 shrink-0
      transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      
      {/* Sidebar Header: Logo + Close Button */}
      <div className="px-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 p-0.5 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all">
            <img src={logo} className="w-full h-full object-contain" alt="Logo" />
          </div>
          <div className="flex flex-col leading-none translate-y-[-1px]">
            <span className="text-lg font-bold tracking-tight text-white">DINGO</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400">AI CORE</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="md:hidden p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <LoginSection isAuthEnabled={isAuthEnabled} user={user} setUser={setUser} />
      
      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 px-4 rounded-2xl shadow-lg transition-all font-medium border border-white/10 backdrop-blur-md"
        >
          <Plus size={18} />
          <span className="font-semibold tracking-wide">New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 mt-2 scrollbar-hide">
        <div className="text-xs font-bold text-slate-500 mb-3 px-3 uppercase tracking-wider">History</div>
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => { onSelectSession(session.id); onClose(); }}
            className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-300 border border-transparent ${
              currentSessionId === session.id
                ? 'bg-white/10 text-white border-white/20 shadow-inner'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:border-white/5'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <MessageSquare size={18} className={`flex-shrink-0 ${currentSessionId === session.id ? 'text-indigo-400' : 'text-slate-500'}`} />
              <div className="truncate text-[15px] font-medium leading-tight">{session.title || 'New Chat'}</div>
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onExport(session); }}
                className="p-1.5 hover:bg-white/10 rounded-md hover:text-indigo-300 transition-colors"
                title="Export"
              >
                <Download size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                className="p-1.5 hover:bg-white/10 rounded-md hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
