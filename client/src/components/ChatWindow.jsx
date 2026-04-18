import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';
import { Code, Plane, BarChart } from 'lucide-react';

export default function ChatWindow({ messages, onSpeak, onStopSpeak, speakingText, onQuickAction }) {
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
    <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 scrollbar-hide z-10 w-full relative">
      <div className="max-w-4xl mx-auto flex flex-col">
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center mt-24 space-y-12"
          >
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-[2rem] flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.4)] border border-white/20 backdrop-blur-xl rotate-3">
                 <span className="text-5xl drop-shadow-2xl -rotate-3">✨</span>
              </div>
              <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight mt-6">
                DINGO AI
              </h2>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onQuickAction(action.prompt)}
                    className="flex flex-col items-center text-center p-6 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 hover:bg-white/10 transition-all shadow-xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.2)]"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 text-indigo-400">
                      <Icon size={20} />
                    </div>
                    <span className="text-[15px] font-medium text-slate-200">{action.title}</span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble 
              key={index} 
              message={message} 
              onSpeak={onSpeak} 
              onStopSpeak={onStopSpeak}
              isSpeakingThis={speakingText === message.content}
            />
          ))
        )}
        <div ref={endRef} className="h-10" />
      </div>
    </div>
  );
}
