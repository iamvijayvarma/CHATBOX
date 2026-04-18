import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Volume2, Square } from 'lucide-react';

export default function MessageBubble({ message, onSpeak, onStopSpeak, isSpeakingThis }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 water-droplet flex items-center justify-center relative shadow-2xl
          ${isUser ? 'border-white/30' : 'border-white/10'}`}>
          <div className="refraction opacity-30" />
          {isUser ? <User size={18} className="text-white" /> : <Bot size={18} className="text-slate-400" />}
        </div>

        {/* Bubble */}
        <div className={`p-5 relative group liquid-glass ${
          isUser 
            ? 'rounded-[2rem] rounded-tr-none border-indigo-500/20 bg-indigo-500/5' 
            : 'rounded-[2rem] rounded-tl-none text-slate-200'
          }`}
        >
          <div className="refraction opacity-10" />
          
          {message.role === 'assistant' && message.content && (
            <div className="absolute -top-10 left-0 opacity-0 group-hover:opacity-100 transition-all flex space-x-2">
               {isSpeakingThis ? (
                 <button onClick={onStopSpeak} className="p-2 bg-black/40 backdrop-blur-xl text-red-500 rounded-xl hover:bg-black/60 border border-white/5 transition-all">
                    <Square size={14} fill="currentColor" />
                 </button>
               ) : (
                 <button onClick={() => onSpeak(message.content)} className="p-2 bg-black/40 backdrop-blur-xl text-slate-400 rounded-xl hover:bg-black/60 border border-white/5 transition-all">
                    <Volume2 size={14} />
                 </button>
               )}
            </div>
          )}

          <div className="prose prose-invert max-w-none text-[15px] leading-relaxed break-words font-medium">
            {message.content === '' ? (
              <span className="flex space-x-2 items-center h-5 px-1">
                <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></motion.span>
                <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-500 rounded-full"></motion.span>
                <motion.span animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-700 rounded-full"></motion.span>
              </span>
            ) : (
              <ReactMarkdown>{message.content}</ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
