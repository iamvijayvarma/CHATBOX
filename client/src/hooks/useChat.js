import { useState } from 'react';

export const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [abortController, setAbortController] = useState(null);

  const sendMessage = async (message, history, onChunk) => {
    setIsLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...history, { role: 'user', content: message }] 
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server Error: ${response.status} - ${errText || 'No details'}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.status === 'searching') {
                setIsSearching(true);
                continue;
              }
              if (parsed.error) {
                const errorMsg = `⚠️ **Error:** ${parsed.error}`;
                fullResponse += errorMsg;
                if (onChunk) onChunk(errorMsg);
                break;
              }
              const { content } = parsed;
              if (content) {
                setIsSearching(false); // Stop searching when content starts arriving
                fullResponse += content;
                if (onChunk) onChunk(content);
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err);
            }
          }
        }
      }

      return fullResponse;
    } catch (err) {
      if (err.name !== 'AbortError') {
        throw err;
      }
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      setAbortController(null);
    }
  };

  return { sendMessage, isLoading, isSearching, abortController, setAbortController, setIsLoading };
};
