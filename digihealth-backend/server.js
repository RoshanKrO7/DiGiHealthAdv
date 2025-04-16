// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
//const Tesseract = require('tesseract.js');
const app = express();

app.use(cors({
    origin: ['https://roshankro7.github.io', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // Securely stored server-side
});

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

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
    let textContent = '';

    // Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      // Process PDF
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      textContent = data.text;
    } else if (file.mimetype.startsWith('image/')) {
      // TEMPORARY: Return a meaningful error about image processing
      return res.status(400).json({
        error: 'Image processing is temporarily unavailable. Please use PDF files for now.'
      });
    } else {
      // Try to read as text
      textContent = fs.readFileSync(file.path, 'utf8');
    }

    // Truncate text to reduce token usage (first 2000 characters should be enough for most reports)
    const truncatedText = textContent.substring(0, 2000);

    // More focused, efficient prompt to reduce token usage
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use 3.5-turbo instead of 4 to reduce cost
      messages: [
        {
          role: "system",
          content: `You are a medical document analyzer specializing in extracting clinical data.
          When analyzing documents, focus on finding:
          - Lab values with their reference ranges
          - Vital signs (BP, HR, temperature)
          - Diagnoses with ICD codes if present
          - Medication names and dosages
          - Follow-up recommendations
          
          Always include these in your response even if values seem uncertain.
          If you can't confidently extract something, make an educated guess rather than omitting it.`
        },
        {
          role: "user",
          content: `Analyze this medical document and extract all possible information:
          ${truncatedText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Lower temperature for more deterministic results
      max_tokens: 500 // Limit output tokens to reduce cost
    });

    const result = JSON.parse(response.choices[0].message.content);

    console.log("OpenAI Response Structure:", 
      Object.keys(result), 
      "Contains summary:", Boolean(result.summary),
      "Contains conditions:", Array.isArray(result.conditions),
      "Contains medications:", Array.isArray(result.medications),
      "Contains recommendations:", Boolean(result.recommendations),
      "Contains parameters:", typeof result.parameters === 'object'
    );

    // Clean up the temporary file
    fs.unlinkSync(file.path);

    // Return the processed data
    res.json({
      parameters: result.parameters || {},
      aiAnalysis: {
        conditions: result.conditions || [],
        medications: result.medications || [],
        recommendations: result.recommendations || "",
        summary: result.summary || ""
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });
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

// Add this to your server.js
app.get('/api/debug', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date(),
        env: process.env.NODE_ENV,
        openaiKey: process.env.OPENAI_API_KEY ? 'present' : 'missing'
    });
});

app.post('/api/debug-upload', upload.single('file'), (req, res) => {
    res.json({
        file: req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        } : 'no file',
        body: req.body
    });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});