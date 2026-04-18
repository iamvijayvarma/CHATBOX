import React, { useRef } from 'react';
import { Plus, MessageSquare, Trash2, Download, Upload, Cpu, PenTool, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onExport,
  onImport,
  persona,
  setPersona
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onImport(event.target.result);
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const personas = [
    { name: 'Assistant', icon: Sparkles },
    { name: 'Coder Wizard', icon: Cpu },
    { name: 'Creative Writer', icon: PenTool },
  ];

  return (
    <div className="w-72 h-full liquid-glass flex flex-col pt-6 z-10 shrink-0 border-r border-white/5">
      
      {/* Persona Selection */}
      <div className="px-6 mb-6">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 block">AI Presence</label>
        <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5 shadow-inner relative">
          {personas.map((p) => {
            const Icon = p.icon;
            const active = persona === p.name;
            return (
              <button
                key={p.name}
                onClick={() => setPersona(p.name)}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl transition-all relative z-10 ${
                  active ? 'text-white droplet-btn !border-white/10' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={p.name}
              >
                {active && (
                  <motion.div 
                    layoutId="activePersona"
                    className="absolute inset-0 bg-white/5 blur-[2px] rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon size={16} className="relative z-20" />
              </button>
            )
          })}
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-6 mb-6">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-4 px-4 rounded-[1.5rem] transition-all font-medium border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={18} />
          <span className="font-semibold tracking-wide text-sm">New Session</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 mt-4 scrollbar-hide">
        <div className="text-[10px] font-bold text-slate-500 mb-4 px-3 uppercase tracking-[0.2em]">Timeline</div>
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-300 border ${
              currentSessionId === session.id
                ? 'bg-white/10 text-white border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.2)]'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <MessageSquare size={16} className={currentSessionId === session.id ? 'text-indigo-400' : 'text-slate-600'} />
              <div className="truncate text-sm font-medium">{session.title || 'New Chat'}</div>
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onExport(session); }}
                className="p-1.5 hover:bg-white/10 rounded-lg hover:text-indigo-300 transition-colors"
              >
                <Download size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                className="p-1.5 hover:bg-white/10 rounded-lg hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer controls */}
      <div className="p-6 border-t border-white/5 bg-black/10">
        <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 text-slate-500 hover:text-white p-3.5 rounded-xl hover:bg-white/5 transition-all text-[13px] font-medium border border-transparent hover:border-white/5"
        >
          <Upload size={16} />
           Import Backup
        </button>
      </div>
    </div>
  );
}
