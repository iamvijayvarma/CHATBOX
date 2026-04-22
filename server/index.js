const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');
const { search } = require('duck-duck-scrape');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

// Helper for Real-Time Search with Timeout
async function performWebSearch(query) {
  try {
    console.log(`Searching for: ${query}`);
    const searchPromise = search(query);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Search Timeout')), 4000)
    );
    const searchResults = await Promise.race([searchPromise, timeoutPromise]);
    if (!searchResults || !searchResults.results || searchResults.results.length === 0) return null;
    return searchResults.results.slice(0, 4).map(r => 
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

app.post('/api/chat', async (req, res) => {
  const { messages, persona = 'Assistant' } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  const lastMessage = messages[messages.length - 1]?.content || "";
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentTime = new Date().toLocaleTimeString('en-US');

  let systemContent = `You are DINGO AI, a premium assistant. Today is ${currentDate}, ${currentTime}. Persona: ${persona}. 
  Be smart, concise, and helpful. Use markdown for better formatting.`;

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 🌐 Web Search Logic
    const needsSearch = lastMessage.toLowerCase().match(/(today|now|current|recent|news|price|who is|what is|weather|latest|time in)/i);
    if (needsSearch) {
      res.write(`data: ${JSON.stringify({ status: 'searching' })}\n\n`);
      const results = await performWebSearch(lastMessage);
      if (results) {
        systemContent += `\n\n[REAL-TIME INFO]:\n${results}`;
      }
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('API Key missing on server');
    }

    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages: [
        { role: 'system', content: systemContent },
        ...messages
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API Error:', error);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }
    res.write(`data: ${JSON.stringify({ error: error.message || 'An unexpected error occurred.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

app.listen(port, () => {
  console.log(`DINGO Server running on port ${port}`);
});
