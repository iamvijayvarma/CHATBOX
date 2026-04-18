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
  persona,
  setPersona
}) {
  const personas = [
    { name: 'Assistant', icon: Sparkles },
    { name: 'Coder Wizard', icon: Cpu },
    { name: 'Creative Writer', icon: PenTool },
  ];

  return (
    <div className="w-72 h-full glass-panel flex flex-col pt-4 z-10 shrink-0">
      
      {/* Persona Selection */}
      <div className="px-4 mb-4">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">AI Persona</label>
        <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 relative">
          {/* Smooth Slider Indicator */}
          <motion.div 
            className="absolute h-[calc(100%-8px)] w-[calc(33.33%-4px)] icon-droplet bg-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.5)] z-0"
            animate={{ 
              left: persona === 'Assistant' ? '4px' : persona === 'Coder Wizard' ? 'calc(33.33% + 2px)' : 'calc(66.66% + 1px)' 
            }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          />

          {personas.map((p) => {
            const Icon = p.icon;
            const active = persona === p.name;
            return (
              <button
                key={p.name}
                onClick={() => setPersona(p.name)}
                className={`flex flex-col items-center justify-center py-2 rounded-lg transition-colors relative z-10 ${
                  active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={p.name}
              >
                <div className={`w-8 h-8 flex items-center justify-center relative z-20`}>
                  <Icon size={16} />
                </div>
              </button>
            )
          })}
        </div>
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
