import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { User, Bot, Volume2, Square } from 'lucide-react';

export default function MessageBubble({ message, onSpeak, onStopSpeak, isSpeakingThis }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 icon-droplet ${isUser ? 'border-white/30' : 'border-white/10'}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Bubble */}
        <div className={`p-4 rounded-2xl relative group ${
          isUser 
            ? 'bg-indigo-600 text-white rounded-br-sm' 
            : 'bg-white/10 backdrop-blur-md border border-white/20 text-slate-100 rounded-bl-sm shadow-xl'
          }`}
        >
          {message.role === 'assistant' && message.content && (
            <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
               {isSpeakingThis ? (
                 <button onClick={onStopSpeak} className="p-1.5 bg-slate-800 text-red-400 rounded-full hover:bg-slate-700">
                    <Square size={14} />
                 </button>
               ) : (
                 <button onClick={() => onSpeak(message.content)} className="p-1.5 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700">
                    <Volume2 size={14} />
                 </button>
               )}
            </div>
          )}

          <div className="prose prose-invert max-w-none text-[15px] leading-relaxed break-words">
            {message.content === '' ? (
              <span className="flex space-x-1 items-center h-5 px-2">
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.span>
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.span>
                <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.span>
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
