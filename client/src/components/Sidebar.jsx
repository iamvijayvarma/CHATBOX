import { Plus, MessageSquare, Trash2, Download, Upload, LogIn } from 'lucide-react';

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onExport,
  user = null,
  onLogin
}) {
  return (
    <div className="w-72 h-full glass-panel flex flex-col pt-4 z-10 shrink-0">
      
      {/* Login / Profile Section */}
      <div className="px-4 mb-6">
        {!user ? (
          <button 
            onClick={onLogin}
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
          <div className="w-full flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
               <span className="text-sky-400 font-bold">{user.name[0]}</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{user.name}</span>
              <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
            </div>
          </div>
        )}
      </div>
      
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
            onClick={() => onSelectSession(session.id)}
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
