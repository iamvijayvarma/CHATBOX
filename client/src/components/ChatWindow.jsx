import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';
import { Code, Plane, BarChart } from 'lucide-react';
import logo from '../assets/logo.png';

export default function ChatWindow({ messages, onSpeak, onStopSpeak, speakingText, onQuickAction, isSearching }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickActions = [
    { icon: Code, title: 'Write React Code', prompt: 'Write a React component for a clean login modal with Tailwind CSS.' },
    { icon: Plane, title: 'Plan exactly a Trip', prompt: 'Create a 3-day itinerary for a relaxing trip to Kyoto, Japan.' },
    { icon: BarChart, title: 'Explain Data', prompt: 'Explain the concept of quantum entanglement intuitively like I am 10.' }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-12 pt-20 md:pt-8 pb-8 scrollbar-hide z-10 w-full relative">
      <div className="max-w-4xl mx-auto flex flex-col h-full">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center space-y-12"
          >
            <div className="text-center space-y-4">
              <div className="w-40 h-40 mx-auto rounded-[2rem] flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.4)] border border-white/20 backdrop-blur-xl rotate-3 overflow-hidden">
                 <img src={logo} className="w-full h-full object-cover -rotate-3 scale-110" alt="Logo" />
              </div>
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight mt-6">
                DINGO AI
              </h2>
            </div>

            {/* Quick Actions Grid */}
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl px-4"
            >
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, scale: 0.9, y: 10 },
                      show: { opacity: 1, scale: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.05, y: -5, transition: { type: "spring", stiffness: 400, damping: 10 } }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onQuickAction(action.prompt)}
                    className="flex flex-col items-center text-center p-6 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 transition-all shadow-xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)]"
                  >
                    <div className="w-10 h-10 icon-droplet mb-3 text-white">
                      <Icon size={20} />
                    </div>
                    <span className="text-[15px] font-medium text-slate-200">{action.title}</span>
                  </motion.button>
                )
              })}
            </motion.div>
          </motion.div>
        ) : (
          <div className="flex flex-col space-y-2">
            {messages.map((message, index) => (
              <MessageBubble 
                key={index} 
                message={message} 
                onSpeak={onSpeak} 
                onStopSpeak={onStopSpeak}
                isSpeakingThis={speakingText === message.content}
              />
            ))}
            {isSearching && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 p-4 bg-white/5 border border-white/5 rounded-2xl w-fit mb-4"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut"
                    }}
                    className="w-1.5 h-1.5 bg-indigo-500/60 rounded-full"
                  />
                ))}
              </motion.div>
            )}
            {/* Spacer to push content above InputBar */}
            <div className="h-40 md:h-48 shrink-0" />
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}
