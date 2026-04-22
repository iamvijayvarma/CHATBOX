const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const { search } = require('duck-duck-scrape');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI/AICC Client config
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

// Helper for Real-Time Search
// Helper for Real-Time Search with Timeout
async function performWebSearch(query) {
  try {
    console.log(`Searching for: ${query}`);
    // Add a 5s race to avoid hanging requests if search is slow
    const searchPromise = search(query);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search Timeout')), 5000)
    );
    
    const searchResults = await Promise.race([searchPromise, timeoutPromise]);
    
    if (!searchResults || !searchResults.results || searchResults.results.length === 0) return null;
    
    return searchResults.results.slice(0, 5).map(r => 
      `Title: ${r.title}\nSnippet: ${r.description}\nSource: ${r.url}`
    ).join('\n\n');
  } catch (err) {
    console.error('Search Error:', err.message);
    return null;
  }
}

// Verify Google Token Endpoint
app.post('/api/auth/google', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });

  try {
    // Verify token and get user info from Google API
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API responded with ${response.status}: ${errText}`);
    }
    
    const data = await response.json();
    res.json({ 
      success: true, 
      user: {
        name: data.name,
        email: data.email,
        avatar: data.picture
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ error: 'Invalid Google token or service unavailable' });
  }
});

// PRO History Persistence Endpoints
app.post('/api/history/save', async (req, res) => {
  const { email, sessions } = req.body;
  if (!email || !sessions) return res.status(400).json({ error: 'Email and sessions required' });

  try {
    const filename = path.join(DATA_DIR, `${Buffer.from(email).toString('hex')}.json`);
    fs.writeFileSync(filename, JSON.stringify(sessions, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Save History Error:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

app.get('/api/history/load', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const filename = path.join(DATA_DIR, `${Buffer.from(email).toString('hex')}.json`);
    if (fs.existsSync(filename)) {
      const data = fs.readFileSync(filename, 'utf-8');
      res.json({ success: true, sessions: JSON.parse(data) });
    } else {
      res.json({ success: true, sessions: [] });
    }
  } catch (error) {
    console.error('Load History Error:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { messages, persona = 'Assistant' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const lastMessage = messages[messages.length - 1]?.content || "";
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US');

  let systemContent = `You are DINGO AI, a premium and highly intelligent assistant. Today is ${currentDate}, at ${currentTime}. 
Maintain context, be concise but detailed when needed, and prioritize accuracy. If you use information from a search, cite the source if possible.`;

  if (persona === 'Coder Wizard') systemContent += "\nPersona: You are a elite software engineer. Provide optimized, clean, and commented code.";
  if (persona === 'Creative Writer') systemContent += "\nPersona: You are an imaginative storyteller. Use vivid language and deep empathy.";

  const modelName = process.env.AI_MODEL || "gpt-4o-mini";

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 🌐 Web Search Logic (Heuristic for real-time info needs)
    const needsSearch = lastMessage.toLowerCase().match(/(today|now|current|recent|news|price|who is|what is|weather|latest)/i);
    let searchContext = "";
    
    if (needsSearch) {
      console.log('Detected need for real-time information. Triggering search...');
      res.write(`data: ${JSON.stringify({ status: 'searching' })}\n\n`);
      const results = await performWebSearch(lastMessage);
      if (results) {
        searchContext = `\n\n[REAL-TIME SEARCH RESULTS]:\n${results}\n\nUse these results to provide the most current information. If the results are not relevant, rely on your knowledge base but mention the lack of fresh data.`;
        systemContent += searchContext;
      }
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    if (OPENAI_KEY) {
      console.log(`Using OpenAI-compatible flow with model: ${modelName}`);
      
      const payload = {
        model: modelName,
        messages: [
          { role: 'system', content: systemContent },
          ...messages
        ],
        stream: true
      };

      const baseUrl = OPENAI_BASE_URL.replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API Error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const data = trimmedLine.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
          } catch (e) { /* silent parse */ }
        }
      }
    } else {
      throw new Error('API Key configuration is missing.');
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Send error message through the stream so the UI can show it
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
    }
    
    res.write(`data: ${JSON.stringify({ error: error.message || 'An unexpected error occurred.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

module.exports = app;
