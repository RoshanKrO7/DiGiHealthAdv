// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Securely stored server-side
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Create endpoint for your health report analysis
app.post('/api/analyze-report', async (req, res) => {
  try {
    const { text, imageUrl, analysisType, isImageAnalysis } = req.body;
    
    // Handle text-based analysis (regular medical reports)
    if (!isImageAnalysis) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a medical data extraction assistant that outputs only valid JSON." },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });
      
      return res.json(JSON.parse(response.choices[0].message.content));
    }
    
    // Handle image-based analysis
    if (isImageAnalysis && imageUrl) {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          { 
            role: "user", 
            content: [
              { type: "text", text: text },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000
      });
      
      return res.json(JSON.parse(response.choices[0].message.content));
    }
    
    res.status(400).json({ error: "Invalid request parameters" });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add this endpoint
app.post('/api/process-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    let text = '';

    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      // Process PDF
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (file.mimetype.startsWith('image/')) {
      // For images, we can use a server-side OCR like Tesseract.js
      // This would require additional setup
      res.status(400).json({ error: 'Image processing not implemented on server yet' });
      return;
    } else {
      // Try to read as text
      text = fs.readFileSync(file.path, 'utf8');
    }

    // Process with OpenAI
    const prompt = `
      You are a medical data extraction assistant. Extract relevant health parameters from the following medical report.
      If you find any of these parameters, provide their values: blood pressure, heart rate, cholesterol, glucose, BMI, A1C, triglycerides, HDL, LDL.
      Also identify any mentioned medical conditions, medications, or doctor's recommendations.
      
      Document text:
      ${text}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a medical data extraction assistant that outputs only valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const result = JSON.parse(response.choices[0].message.content);

    // Clean up the temporary file
    fs.unlinkSync(file.path);

    // Return the processed data
    res.json({
      parameters: result.parameters || {},
      aiAnalysis: {
        conditions: result.conditions || [],
        medications: result.medications || [],
        recommendations: result.recommendations || [],
        summary: result.summary || ""
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add this code to your server.js to handle structured responses
app.post('/api/health-recommendations', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a health recommendations assistant that outputs only valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });
    
    res.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});