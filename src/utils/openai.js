import OpenAI from 'openai';

// Create OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For client-side usage
});

// Define available models
export const MODELS = {
  GPT4: 'gpt-4o',
  GPT4_VISION: 'gpt-4-vision-preview',
  GPT3_5: 'gpt-3.5-turbo'
};

// Utility functions
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