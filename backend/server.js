const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from React app
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Check if Hugging Face API key is configured
if (!process.env.HUGGINGFACE_API_KEY) {
  console.error('HUGGINGFACE_API_KEY is not set in .env');
  process.exit(1);
}

// Chat endpoint using Hugging Face GPT-2
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }
    // Build a simple chat history prompt
    const prompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text || m.content}`).join('\n') + '\nAssistant:';
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        inputs: prompt,
          parameters: {
          max_new_tokens: 100,
          temperature: 0.7
        }
      }),
    });
    const data = await response.json();
    let reply = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text.replace(prompt, '').trim();
    } else if (typeof data.generated_text === 'string') {
      reply = data.generated_text.replace(prompt, '').trim();
    } else {
      reply = 'Sorry, I could not generate a response.';
    }
    res.json({ message: { role: 'assistant', text: reply } });
  } catch (error) {
    console.error('GPT-2 API error:', error);
    res.status(500).json({ error: 'Failed to process chat request', details: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check request received');
  res.json({ 
    status: 'ok',
    huggingfaceConfigured: !!process.env.HUGGINGFACE_API_KEY
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 