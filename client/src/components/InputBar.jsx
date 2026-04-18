import React, { useRef, useEffect } from 'react';
import { Send, Mic, Square } from 'lucide-react';

export default function InputBar({ input, setInput, onSubmit, isListening, toggleListening, isLoading, abortController }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) onSubmit();
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto pb-8 px-6">
      <div className="relative flex items-end w-full liquid-glass rounded-[2.5rem] p-3 pl-8 focus-within:ring-2 focus-within:ring-white/10 transition-all border border-white/5 bg-[#121418]/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="refraction opacity-20" />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full max-h-[150px] bg-transparent text-slate-100 placeholder-slate-500 resize-none outline-none py-4 text-[15px] font-medium"
          rows={1}
        />

        <div className="flex items-center space-x-3 pl-4 pb-1.5 pr-2 relative z-10">
          <button
            onClick={toggleListening}
            className={`p-3.5 rounded-2xl transition-all border ${
              isListening 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-white/5 text-slate-500 hover:text-slate-300 border-white/5 hover:bg-white/10'
            }`}
          >
            <Mic size={18} className={isListening ? 'animate-pulse' : ''} />
          </button>

          {isLoading ? (
            <button
              onClick={handleStop}
              className="p-3.5 bg-red-600 text-white rounded-2xl hover:bg-red-500 transition-all shadow-[0_4px_15px_rgba(220,38,38,0.3)]"
            >
              <Square size={18} fill="currentColor" />
            </button>
          ) : (
             <button
              onClick={onSubmit}
              disabled={!input.trim()}
              className="p-3.5 bg-white text-black rounded-2xl hover:bg-slate-200 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_4px_20px_rgba(255,255,255,0.1)] active:scale-95"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em] opacity-50">
        Organic Intelligence Engine • Liquid v2.1
      </div>
    </div>
  );
}
