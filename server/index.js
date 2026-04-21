const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

// Verify Google Token Endpoint
app.post('/api/auth/google', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: 'accessToken is required' });

  try {
    // Verify token and get user info from Google API
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!response.ok) throw new Error('Failed to fetch user info from Google');
    
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
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { messages, persona = 'Assistant' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  let systemContent = "You are a precise and intelligent AI assistant. Maintain context and respond clearly.";
  if (persona === 'Coder Wizard') systemContent = "You are a top-tier software engineer and coding wizard. Provide exact, highly optimized code snippets.";
  if (persona === 'Creative Writer') systemContent = "You are an imaginative creative writer. Use vivid language, storytelling techniques, and deep empathy.";

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemContent 
    });

    // Convert messages to Gemini format
    const chatHistory = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));
    
    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessageStream(lastMessage);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) res.write(`data: ${JSON.stringify({ content: chunkText })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.log('Gemini API Error:', error);
    
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    let mockStr = `**[DINGO AI - ${persona.toUpperCase()}]**\n\n`;
    
    if (persona === 'Coder Wizard') {
      mockStr += `👩‍💻 *Gemini integration initializing...*\n\nSince no valid key is set, I've generated a simulated response for: "${lastUserMessage.slice(0, 30)}..."\n\n\`\`\`javascript\nconsole.log("DINGO AI optimized code for ${persona}.");\n\`\`\`\n\n*(Add your Gemini key to .env for real intelligence!)*`;
    } else {
      mockStr += `🤖 *DINGO AI (Gemini Mode) Processing: "${lastUserMessage.slice(0, 50)}..."*\n\nI am currently in **DINGO AI Demo Mode** because the Gemini key is missing or invalid. \n\n**Next Steps:**\n1. Get your key at aistudio.google.com\n2. Update your Vercel settings.\n\nKeep exploring DINGO AI!`;
    }
    
    const words = mockStr.split(/([ \n]+)/);
    let i = 0;
    
    if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
    }

    const sendChunk = () => {
       if (i < words.length) {
          res.write(`data: ${JSON.stringify({ content: words[i] })}\n\n`);
          i++;
          setTimeout(sendChunk, 30);
       } else {
          res.write('data: [DONE]\n\n');
          res.end();
       }
    };
    
    setTimeout(sendChunk, 100);
  }
});

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
