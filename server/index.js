const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing_key',
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
    if (error.status === 401 || process.env.OPENAI_API_KEY === undefined || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      console.log('401 Unauthorized detected. Falling back to Mock Demo Mode.');
      const personaIntro = persona === 'Coder Wizard' ? '👩‍💻 *Beep boop! Code compiled!* ' : persona === 'Creative Writer' ? '✨ *A tale begins...* ' : '🤖 *System online...* ';
      const mockStr = `**[LIQUID DEMO MODE ACTIVE - ${persona.toUpperCase()}]**\n\n${personaIntro} It looks like you haven't plugged in a real OpenAI API Key into \`server/.env\` yet. \n\nHowever, **the true Liquid Glass UI is now actively rendering!** \n\nHere are the new features you are experiencing right now:\n1. **Animated Ambient Globs**: Check out those dynamically floating gradient orbs in the background.\n2. **Deep Glassmorphism**: Notice the sharp white borders and the intense \`backdrop-blur-3xl\` rendering.\n3. **Quick Action Cards & Personas**: You successfully triggered this via the UI!\n\n*(To chat with the real intelligence using this beautiful UI, just update your API key and restart the server!)*`;
      
      const words = mockStr.split(/([ \n]+)/); // preserve spaces and newlines
      let i = 0;
      
      // We must make sure headers are set if error happened before. 
      // Express might throw if headers already sent, but stream errors usually throw immediately.
      if (!res.headersSent) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
      }

      const sendChunk = () => {
         if (i < words.length) {
            res.write(`data: ${JSON.stringify({ content: words[i] })}\n\n`);
            i++;
            setTimeout(sendChunk, Math.random() * 50 + 20); // random typing speed
         } else {
            res.write('data: [DONE]\n\n');
            res.end();
         }
      };
      
      setTimeout(sendChunk, 500);
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
