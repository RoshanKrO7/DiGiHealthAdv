// Replace the direct OpenAI initialization with a proxy service

// Define available models for reference
export const MODELS = {
  GPT4: 'gpt-4',
  GPT3_5: 'gpt-3.5-turbo'
};

// Use the render.com backend
const BACKEND_URL = 'https://digihealth-backend.onrender.com/api';

// Create a proxy for OpenAI API calls
export const callOpenAI = async (prompt, options = {}) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log('Calling OpenAI proxy with options:', { 
        ...options, 
        text: '[Text prompt omitted]',
        model: options.model || MODELS.GPT4
      });
      
      // Set up request timeout
      const timeoutDuration = options.timeout || 45000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      try {
        // Prepare the request body
        const requestBody = {
          text: prompt,
          model: options.model || MODELS.GPT4
        };
        
        // Use the analyze-report endpoint
        const endpoint = `${BACKEND_URL}/analyze-report`;
        
        console.log('Making request to:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        // Clear the timeout
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          let errorMessage = `OpenAI API request failed: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If we can't parse the error, use the default message
          }
          throw new Error(errorMessage);
        }
        
        return await response.json();
      } catch (fetchError) {
        // Clear the timeout to prevent memory leaks
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      // Provide more specific error messages based on error type
      if (error.name === 'AbortError') {
        throw new Error('OpenAI request timed out. The model may be taking too long to process your request. Try again with a simpler query.');
      } else if (error.message.includes('Failed to fetch')) {
        if (retryCount < maxRetries - 1) {
          retryCount++;
          console.log(`Retrying request (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          continue;
        }
        throw new Error('Could not connect to the OpenAI service. Please check your internet connection or try again later.');
      } else if (error.message.includes('404')) {
        throw new Error('Backend service is not available. Please check if the backend server is running and accessible.');
      }
      
      throw error;
    }
  }
};

// System prompt generator (keep this as is)
export const generateSystemPrompt = (context = {}) => {
  let prompt = "You are a medical AI assistant providing health information. ";
  prompt += "Always clarify you're not a doctor and serious concerns require medical attention.";
  
  if (context.userProfile) {
    // Add relevant user context
    const { age, gender, conditions = [], medications = [] } = context.userProfile;
    
    prompt += "\n\nUser context:";
    if (age) prompt += `\nAge: ${age}`;
    if (gender) prompt += `\nGender: ${gender}`;
    if (conditions.length) prompt += `\nConditions: ${conditions.join(', ')}`;
    if (medications.length) prompt += `\nMedications: ${medications.join(', ')}`;
  }
  
  return prompt;
};