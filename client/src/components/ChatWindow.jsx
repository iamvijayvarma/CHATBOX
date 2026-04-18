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
            className="h-full flex flex-col items-center justify-center mt-24 space-y-16"
          >
            <div className="text-center space-y-6">
              <div className="water-droplet w-24 h-24 mx-auto flex items-center justify-center relative">
                <div className="refraction opacity-40" />
                <span className="text-5xl drop-shadow-2xl">💧</span>
              </div>
              <h2 className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                DINGO AI
              </h2>
              <p className="text-slate-500 font-medium tracking-wide">Select an organic probe to begin</p>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onQuickAction(action.prompt)}
                    className="droplet-btn group p-8 flex flex-col items-center text-center space-y-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-500/20 transition-all border border-white/5">
                      <Icon size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-300 tracking-wide uppercase relative z-10">{action.title}</span>
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
