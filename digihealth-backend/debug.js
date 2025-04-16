// debug.js - A utility script to test OpenAI API and file processing
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const pdfParse = require('pdf-parse');

// Get API key from environment variables (works with Render and local .env)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Create OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

// Helper to safely display API key status
const safeDisplayApiKey = (apiKey) => {
  if (!apiKey) return 'Not found';
  // Only show first 5 and last 4 characters
  if (apiKey.length > 12) {
    return `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`;
  }
  return 'Invalid format';
};

// Test functions
async function testOpenAIConnection() {
  console.log('\n===== Testing OpenAI API Connection =====');
  try {
    if (!OPENAI_API_KEY) {
      console.error('Error: No OpenAI API key found in environment variables');
      console.log('  → Make sure to set OPENAI_API_KEY in Render dashboard or .env file');
      return false;
    }
    
    console.log('API Key Status:', safeDisplayApiKey(OPENAI_API_KEY));
    console.log('Running on Render:', Boolean(process.env.RENDER_SERVICE_ID));
    
    const models = await openai.models.list();
    console.log('Connection successful!');
    console.log('Available models:', models.data.slice(0, 5).map(m => m.id).join(', '), '...');
    return true;
  } catch (error) {
    console.error('Error connecting to OpenAI API:', error.message);
    if (error.status) console.error('Status Code:', error.status);
    if (error.type) console.error('Error Type:', error.type);
    
    // Provide more helpful error messages based on error type
    if (error.message.includes('401')) {
      console.error('This is likely due to an invalid API key. Check your API key in Render environment variables.');
    } else if (error.message.includes('429')) {
      console.error('You have exceeded your API rate limit or have insufficient quota.');
    } else if (error.message.includes('connection')) {
      console.error('Network connection issue. Check if Render has outbound access to the OpenAI API.');
    }
    
    return false;
  }
}

async function testTextProcessing() {
  console.log('\n===== Testing Text Processing =====');
  try {
    if (!OPENAI_API_KEY) {
      console.error('Error: Cannot run text processing test without an API key');
      return false;
    }
    
    const sampleText = "Patient shows normal blood pressure of 120/80 mmHg, cholesterol levels at 180 mg/dL. Diagnosed with Type 2 Diabetes, currently managed with Metformin 500mg twice daily. Follow-up appointment scheduled in 3 months.";
    
    console.log('Sample text:', sampleText);
    console.log('Sending to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a medical document analyzer specializing in extracting clinical data.
          Extract and return a JSON object with:
          - parameters (lab values and vital signs)
          - conditions (medical conditions)
          - medications (medication names and dosages)
          - recommendations (follow-up recommendations)
          - summary (brief summary)`
        },
        {
          role: "user",
          content: `Analyze this medical text: ${sampleText}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    console.log('Processing successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('Error processing text:', error.message);
    
    // Additional error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return false;
  }
}

async function testPDFProcessing(pdfPath) {
  console.log('\n===== Testing PDF Processing =====');
  try {
    if (!pdfPath) {
      console.log('No PDF path provided, skipping test');
      return true; // Return true since this is an optional test
    }
    
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF file not found at path: ${pdfPath}`);
      return false;
    }
    
    console.log('Reading PDF file:', pdfPath);
    const dataBuffer = fs.readFileSync(pdfPath);
    console.log('PDF loaded, extracting text...');
    
    const data = await pdfParse(dataBuffer);
    console.log('Text extraction successful!');
    console.log('PDF page count:', data.numpages);
    console.log('First 100 characters:', data.text.substring(0, 100).replace(/\n/g, ' '), '...');
    
    return true;
  } catch (error) {
    console.error('Error processing PDF:', error.message);
    return false;
  }
}

// Function to check if running on Render
function isRunningOnRender() {
  return Boolean(process.env.RENDER_SERVICE_ID || process.env.RENDER);
}

// Run all tests
async function runTests() {
  console.log('==== DigiHealth Backend Diagnostic Tool ====');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Running on Render:', isRunningOnRender());
  console.log('OpenAI API Key Present:', Boolean(OPENAI_API_KEY));
  console.log('Starting tests...');
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const pdfPath = args[0]; // First argument is PDF path (optional)
  
  let success = true;
  
  // Test OpenAI connection
  const connectionSuccess = await testOpenAIConnection();
  success = success && connectionSuccess;
  
  // Only run text processing if connection was successful
  let textSuccess = false;
  if (connectionSuccess) {
    textSuccess = await testTextProcessing();
    success = success && textSuccess;
  } else {
    console.log('\n===== Skipping Text Processing Test =====');
    console.log('Reason: OpenAI connection failed');
  }
  
  // Test PDF processing if path provided and not on Render
  let pdfSuccess = true; // default to true since this test is optional
  if (pdfPath) {
    if (isRunningOnRender()) {
      console.log('\n===== Skipping PDF Processing Test =====');
      console.log('Reason: Running on Render, file system access limited');
    } else {
      pdfSuccess = await testPDFProcessing(pdfPath);
      success = success && pdfSuccess;
    }
  }
  
  console.log('\n===== Test Summary =====');
  console.log('OpenAI Connection:', connectionSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('Text Processing:', connectionSuccess ? (textSuccess ? '✅ PASS' : '❌ FAIL') : '⏭️ SKIPPED');
  if (pdfPath && !isRunningOnRender()) {
    console.log('PDF Processing:', pdfSuccess ? '✅ PASS' : '❌ FAIL');
  }
  
  console.log('\nOverall Status:', success ? '✅ All tests passed!' : '❌ Some tests failed');
  
  if (!success) {
    console.log('\nTroubleshooting tips:');
    if (!OPENAI_API_KEY) {
      console.log('• ENVIRONMENT VARIABLE ISSUE: OPENAI_API_KEY is missing');
      if (isRunningOnRender()) {
        console.log('  → Set the OPENAI_API_KEY in your Render dashboard:');
        console.log('     1. Go to the Render dashboard');
        console.log('     2. Select your DigiHealth Backend service');
        console.log('     3. Go to Environment tab');
        console.log('     4. Add OPENAI_API_KEY with your API key value');
        console.log('     5. Click Save Changes and deploy a new version');
      } else {
        console.log('  → Create or update your .env file with OPENAI_API_KEY=your_key_here');
      }
    } else if (!connectionSuccess) {
      console.log('• API CONNECTION ISSUE: Could not connect to OpenAI API');
      console.log('  → Check that your API key is valid and has available credits');
      console.log('  → Verify network connectivity to OpenAI API');
    }
    
    if (!textSuccess && connectionSuccess) {
      console.log('• TEXT PROCESSING ISSUE: Failed to process text');
      console.log('  → Check OpenAI API logs for more details');
    }
    
    if (pdfPath && !pdfSuccess && !isRunningOnRender()) {
      console.log('• PDF PROCESSING ISSUE: Failed to process PDF');
      console.log('  → Make sure pdf-parse is properly installed (npm install pdf-parse)');
      console.log('  → Check that the PDF file is valid and not corrupted');
    }
  }

  process.exit(success ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error during tests:', error);
  process.exit(1);
}); 