const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { OpenAI } = require('openai');

const { OAuth2Client } = require('google-auth-library');
const app = express();
const port = process.env.PORT || 3000;

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing_key',
  baseURL: process.env.OPENAI_BASE_URL || undefined,
});

app.post('/api/chat', async (req, res) => {
  const { messages, persona = 'Assistant' } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  let systemContent = "You are a precise and intelligent AI assistant. Maintain context and respond clearly.";
  if (persona === 'Coder Wizard') systemContent = "You are a top-tier software engineer and coding wizard. Provide exact, highly optimized code snippets.";
  if (persona === 'Creative Writer') systemContent = "You are an imaginative creative writer. Use vivid language, storytelling techniques, and deep empathy.";

  const systemPrompt = { role: 'system', content: systemContent };

  const hasSystemPrompt = messages.length > 0 && messages[0].role === 'system';
  const finalMessages = hasSystemPrompt ? messages : [systemPrompt, ...messages];

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: finalMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.log('Chat API Error:', error);
    if (error.status === 401 || process.env.OPENAI_API_KEY === undefined || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('Falling back to Contextual Mock Mode.');
      
      const lastUserMessage = messages[messages.length - 1]?.content || '';
      let mockStr = `**[DINGO AI - ${persona.toUpperCase()}]**\n\n`;

      if (persona === 'Coder Wizard') {
        mockStr += `👩‍💻 *Beep boop! DINGO AI core analyzing...*\n\nSince no API key is set, I've generated a simulated response for: "${lastUserMessage.slice(0, 30)}..."\n\n\`\`\`javascript\n// DINGO Mock Engine\nfunction demo() {\n  console.log("DINGO AI optimized code for ${persona}.");\n  return true;\n}\n\`\`\`\n\n*(Add your OpenAI key to .env for real intelligence!)*`;
      } else if (persona === 'Creative Writer') {
        mockStr += `✨ *DINGO AI's artistic processors are humming...*\n\nYour prompt about "${lastUserMessage.slice(0, 30)}..." inspired a vision! \n\n"The digital dingo leaves tracks through the source code, weaving a tale from the bits and bytes of your imagination..."\n\n*(To continue this story with GPT-4, update your API key!)*`;
      } else {
        mockStr += `🤖 *DINGO AI Processing: "${lastUserMessage.slice(0, 50)}..."*\n\nI am currently in **DINGO AI Demo Mode** because the API key is missing. However, I can still confirm that the UI is fully reactive! \n\n**Next Steps:**\n1. Find your API key at platform.openai.com\n2. Paste it into \`server/.env\`\n3. Restart the server.\n\nKeep exploring DINGO AI!`;
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
            setTimeout(sendChunk, Math.random() * 30 + 10);
         } else {
            res.write('data: [DONE]\n\n');
            res.end();
         }
      };
      
      setTimeout(sendChunk, 200);
      return;
    }
    
    console.error('Error in chat API:', error);
    if (!res.headersSent) {
        res.setHeader('Content-Type', 'text/event-stream');
    }
    res.write(`data: ${JSON.stringify({ error: error.message || 'Server Error' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
