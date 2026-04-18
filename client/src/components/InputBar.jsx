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
    <div className="relative w-full max-w-4xl mx-auto pb-6 px-4">
      <div className="relative flex items-end w-full glass-panel rounded-3xl p-2 pl-5 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all border border-white/10 bg-[#0f172a]/80 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message DINGO AI..."
          className="w-full max-h-[150px] bg-transparent text-slate-100 placeholder-slate-400 resize-none outline-none py-3.5 text-[15px]"
          rows={1}
        />

        <div className="flex items-center space-x-2 pl-2 pb-1.5 pr-1">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-full transition-all ${
              isListening 
                ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
          </button>

          {isLoading ? (
            <button
              onClick={handleStop}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
            >
              <Square size={20} fill="currentColor" />
            </button>
          ) : (
             <button
              onClick={onSubmit}
              disabled={!input.trim()}
              className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-600/30"
            >
              <Send size={20} />
            </button>
          )}
        </div>
      </div>
      <div className="text-center mt-3 text-xs text-slate-500/80 font-medium tracking-wide">
        AI responses may be inaccurate. Verify important information.
      </div>
    </div>
  );
}
