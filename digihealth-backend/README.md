# DigiHealth Backend

Backend service for the DigiHealth healthcare application. This service processes medical documents using AI to extract relevant information.

## Features

- Medical document processing and analysis
- PDF text extraction
- AI-powered health data extraction
- Secure environment variable handling

## Deployment to Render

### Setting Up Environment Variables in Render

1. **Sign in to your Render account** at [dashboard.render.com](https://dashboard.render.com)

2. **Select your DigiHealth Backend service** from the dashboard

3. **Navigate to the Environment tab**

4. **Add the following environment variables:**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PORT`: 3001 (or your preferred port)
   - Any other environment variables your application needs

5. **Click "Save Changes"** and deploy a new version

![Render Environment Variables](https://render.com/static/environment-variables.png)

### Important Notes for Render Deployment

- Your OpenAI API key is **never stored in code** but only in the Render environment variables
- If you update environment variables, you need to deploy a new version for changes to take effect
- Check the "Logs" tab in Render if you encounter any issues with your deployment

## Local Development

1. Clone the repository
2. Create a `.env` file with the required environment variables (see `.env.example`)
3. Install dependencies:
   ```
   npm install
   ```
4. Run the development server:
   ```
   npm start
   ```

## Testing

You can test the backend functionality using the included debug script:

```
node debug.js
```

This will check:
- OpenAI API connectivity
- Text processing capabilities
- PDF processing (if a file path is provided)

## API Endpoints

### `/api/process-file`
Processes medical documents and extracts information using AI.

**Method:** POST  
**Content-Type:** multipart/form-data  
**Body:** File upload with field name 'file'

### `/api/analyze-report`
Analyzes medical text directly.

**Method:** POST  
**Content-Type:** application/json  
**Body:**
```json
{
  "text": "Your medical text here",
  "isImageAnalysis": false
}
```

### `/api/health-recommendations`
Provides health recommendations based on a prompt.

**Method:** POST  
**Content-Type:** application/json  
**Body:**
```json
{
  "prompt": "Your health prompt here"
}
```

### `/api/debug`
Checks the service status and environment.

**Method:** GET

### `/api/check-env`
Validates environment variables are set (without exposing values).

**Method:** GET

## Troubleshooting

### OpenAI API Issues

If the AI features aren't working:

1. Check that your OpenAI API key is valid and has sufficient credit
2. Verify the environment variable is set correctly in Render
3. Check the logs in Render for specific error messages
4. Run the debug script to validate the API connection

### PDF Processing Issues

If PDF processing isn't working:

1. Ensure the PDF files are valid and not corrupted
2. Check if the pdf-parse library is properly installed
3. Verify the uploaded file is within the size limit (10MB)

### Cannot Connect to Server

If you cannot connect to the backend:

1. Verify the server is running (check Render dashboard)
2. Check CORS settings if making cross-origin requests
3. Ensure your frontend is connecting to the correct URL

## License

[MIT](LICENSE) 