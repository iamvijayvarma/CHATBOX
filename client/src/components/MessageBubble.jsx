import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Volume2, Square, Copy, Check } from 'lucide-react';

const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return !inline && match ? (
    <div className="relative group/code my-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        <span>{match[1]}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        style={atomDark}
        language={match[1]}
        PreTag="div"
        customStyle={{
          margin: 0,
          background: 'transparent',
          padding: '1.25rem',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={`${className} bg-white/10 px-1.5 py-0.5 rounded-md text-sky-300 font-mono text-[14px]`} {...props}>
      {children}
    </code>
  );
};

export default function MessageBubble({ message, onSpeak, onStopSpeak, isSpeakingThis }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = React.useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border border-white/10 ${isUser ? 'bg-indigo-600/30' : 'bg-white/10'}`}>
          {isUser ? <User size={18} className="text-indigo-300" /> : <Bot size={18} className="text-slate-300" />}
        </div>
        {/* Bubble */}
        <div className={`p-4 rounded-3xl relative group transition-all duration-300 ${
          isUser 
            ? 'bg-indigo-600/20 text-white border border-indigo-500/20 hover:bg-indigo-600/30' 
            : 'bg-white/[0.03] backdrop-blur-3xl border border-white/5 text-slate-100 hover:bg-white/[0.06] shadow-2xl'
          }`}
        >
          {message.role === 'assistant' && message.content && (
            <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
               <button 
                onClick={handleCopyMessage}
                className="p-1.5 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors"
                title="Copy Message"
               >
                 {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
               </button>
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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
