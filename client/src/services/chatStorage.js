const STORAGE_KEY = 'ai_chat_sessions';

export const chatStorage = {
  getSessions: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return [];
    }
  },

  saveSessions: (sessions) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  },

  createSession: (title = 'New Chat') => {
    const newSession = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      timestamp: Date.now(),
    };
    const sessions = chatStorage.getSessions();
    chatStorage.saveSessions([newSession, ...sessions]);
    return newSession;
  },

  updateSession: (id, updates) => {
    const sessions = chatStorage.getSessions();
    const index = sessions.findIndex((s) => s.id === id);
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...updates };
      chatStorage.saveSessions(sessions);
    }
  },

  deleteSession: (id) => {
    const sessions = chatStorage.getSessions();
    const newSessions = sessions.filter((s) => s.id !== id);
    chatStorage.saveSessions(newSessions);
    return newSessions;
  },

  exportChat: (session, format = 'json') => {
    let content, mimeType, filename;
    
    if (format === 'json') {
      content = JSON.stringify(session, null, 2);
      mimeType = 'application/json';
      filename = `chat_${session.id}.json`;
    } else {
      content = session.messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
      mimeType = 'text/plain';
      filename = `chat_${session.id}.txt`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  importChat: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.id && parsed.messages) {
        // give it a new ID to avoid collisions
        const newSession = {
          ...parsed,
          id: crypto.randomUUID(),
          title: `Imported: ${parsed.title || 'Chat'}`,
          timestamp: Date.now(),
        };
        const sessions = chatStorage.getSessions();
        chatStorage.saveSessions([newSession, ...sessions]);
        return newSession;
      }
      throw new Error('Invalid format');
    } catch (error) {
      console.error('Invalid JSON for import', error);
      return null;
    }
  }
};
