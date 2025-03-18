// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Securely stored server-side
});

// Create endpoint for your health report analysis
app.post('/api/analyze-report', async (req, res) => {
  try {
    const { text } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a medical data extraction assistant that outputs only valid JSON." },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    
    res.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});