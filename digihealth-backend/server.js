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

// Enhanced CORS configuration
app.use(cors({
    origin: ['https://roshankro7.github.io', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Get OpenAI API key from environment variables
// This works both locally with .env and on Render with environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validate OpenAI API key
if (!OPENAI_API_KEY) {
  console.error('WARNING: OPENAI_API_KEY is not set. Please set it in the Render dashboard environment variables.');
  // Not exiting process, just warning - in case you want the server to start anyway
}

// Initialize OpenAI client with the API key
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Add API key validation function
const validateOpenAI = async () => {
  try {
    if (!OPENAI_API_KEY) {
      console.error('Cannot validate OpenAI API: No API key provided');
      return false;
    }
    
    // Simple test call to validate API key
    await openai.models.list();
    console.log('OpenAI API key is valid');
    return true;
  } catch (error) {
    console.error('OpenAI API key validation failed:', error.message);
    return false;
  }
};

// Run validation on startup, but don't block server start
validateOpenAI().then(isValid => {
  if (isValid) {
    console.log('✅ OpenAI API connection successful');
  } else {
    console.error('❌ OpenAI API connection failed - AI features will not work');
  }
}).catch(err => {
  console.error('Error validating OpenAI API key:', err);
});

// Enhanced multer configuration with better error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads', { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only specific file types
  const allowedMimes = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, TXT, DOC, DOCX, JPEG and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Middleware for handling multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    // An unknown error occurred
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Create endpoint for your health report analysis
app.post('/api/analyze-report', async (req, res) => {
  try {
    const { text, imageUrl, analysisType, isImageAnalysis } = req.body;
    
    // Validate required fields
    if (!text) {
      return res.status(400).json({ error: "Text content is required" });
    }
    
    // Handle text-based analysis (regular medical reports)
    if (!isImageAnalysis) {
      try {
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
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError);
        return res.status(500).json({ error: "AI processing error", details: openaiError.message });
      }
    }
    
    // Handle image-based analysis
    if (isImageAnalysis && imageUrl) {
      try {
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
      } catch (openaiError) {
        console.error("OpenAI Vision API error:", openaiError);
        return res.status(500).json({ error: "AI image processing error", details: openaiError.message });
      }
    }
    
    res.status(400).json({ error: "Invalid request parameters" });
  } catch (error) {
    console.error("General error in analyze-report:", error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced process-file endpoint
app.post('/api/process-file', upload.single('file'), handleMulterError, async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    filePath = req.file.path;
    const file = req.file;
    
    console.log('Processing file:', {
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      path: file.path
    });
    
    let textContent = '';
    let textExtractionMethod = '';

    try {
      // Extract text based on file type
      if (file.mimetype === 'application/pdf') {
        textExtractionMethod = 'pdf-parse';
        const dataBuffer = fs.readFileSync(file.path);
        const data = await pdfParse(dataBuffer);
        textContent = data.text;
      } else if (file.mimetype.startsWith('image/')) {
        textExtractionMethod = 'image processing disabled';
        return res.status(400).json({
          error: 'Image processing is temporarily unavailable. Please use PDF files for now.'
        });
      } else {
        textExtractionMethod = 'plain text';
        textContent = fs.readFileSync(file.path, 'utf8');
      }
    } catch (extractionError) {
      console.error('Text extraction error:', extractionError);
      return res.status(400).json({ 
        error: 'Failed to extract text from file', 
        details: extractionError.message 
      });
    }
    
    if (!textContent || textContent.trim().length === 0) {
      console.warn('No text content could be extracted from file');
      return res.status(400).json({ 
        error: 'No text content could be extracted from the file' 
      });
    }
    
    // Truncate text to reduce token usage (first 2000 characters should be enough for most reports)
    const textLength = textContent.length;
    const truncatedText = textContent.substring(0, 2000);
    console.log(`Extracted text length: ${textLength}, truncated to: ${truncatedText.length}`);
    console.log(`Text extraction method: ${textExtractionMethod}`);

    try {
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
            
            Return a JSON object with these fields:
            - parameters: an object with key-value pairs for lab values and vital signs
            - conditions: an array of medical conditions mentioned
            - medications: an array of medications mentioned
            - recommendations: any recommendations found
            - summary: a brief summary of the document
            
            Always include these fields in your response even if values are not found.
            If a field has no values, use an empty object, array, or string as appropriate.`
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

      // Parse and validate response
      let result;
      try {
        result = JSON.parse(response.choices[0].message.content);
        
        // Ensure all expected fields exist with default values
        result = {
          parameters: result.parameters || {},
          aiAnalysis: {
            conditions: Array.isArray(result.conditions) ? result.conditions : [],
            medications: Array.isArray(result.medications) ? result.medications : [],
            recommendations: result.recommendations || "",
            summary: result.summary || ""
          }
        };
        
        console.log("OpenAI Response Structure:", 
          Object.keys(result), 
          "Contains parameters:", typeof result.parameters === 'object',
          "Contains aiAnalysis:", typeof result.aiAnalysis === 'object'
        );
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        console.error('Raw response:', response.choices[0].message.content);
        
        // Create a default response structure
        result = {
          parameters: {},
          aiAnalysis: {
            conditions: [],
            medications: [],
            recommendations: "Unable to process content.",
            summary: `This document appears to be a ${file.mimetype.split('/')[1]} file, but couldn't be automatically analyzed.`
          }
        };
      }

      // Return the processed data
      res.json(result);
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      res.status(500).json({ 
        error: 'Error processing with AI', 
        details: openaiError.message 
      });
    }
  } catch (error) {
    console.error('General error processing file:', error);
    res.status(500).json({ 
      error: 'Error processing file',
      details: error.message
    });
  } finally {
    // Clean up the temporary file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('Temporary file deleted:', filePath);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
  }
});

// Health recommendations endpoint
app.post('/api/health-recommendations', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    
    try {
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
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      res.status(500).json({ error: "AI processing error", details: openaiError.message });
    }
  } catch (error) {
    console.error("General error in health-recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoints
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    // Return a safer representation of the API key status
    openaiKey: OPENAI_API_KEY ? 'present' : 'missing',
    renderService: process.env.RENDER_SERVICE_ID ? 'true' : 'false',
    version: '1.0.3'
  });
});

app.post('/api/debug-upload', upload.single('file'), handleMulterError, (req, res) => {
  res.json({
    status: 'ok',
    file: req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'no file',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Add these endpoints for Render health checks and environment variable checks
app.get('/', (req, res) => {
  res.send('DigiHealth API is running');
});

app.get('/api/check-env', (req, res) => {
  // Only return environment variable presence, not values
  const envVars = {
    NODE_ENV: process.env.NODE_ENV ? 'set' : 'not set',
    OPENAI_API_KEY: OPENAI_API_KEY ? 'set' : 'not set',
    PORT: process.env.PORT ? 'set' : 'not set',
    // Add any other environment variables you want to check (just presence, not values)
  };
  
  res.json({
    timestamp: new Date().toISOString(),
    environment: envVars,
    isRender: Boolean(process.env.RENDER_SERVICE_ID)
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message 
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  // Clean up temp files
  if (fs.existsSync('uploads')) {
    try {
      const files = fs.readdirSync('uploads');
      files.forEach(file => {
        fs.unlinkSync(path.join('uploads', file));
      });
    } catch (err) {
      console.error('Error cleaning up uploads directory:', err);
    }
  }
  process.exit(0);
});