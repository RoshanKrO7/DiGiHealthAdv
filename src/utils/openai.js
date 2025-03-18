// Replace the direct OpenAI initialization with a proxy service

// Define available models for reference
export const MODELS = {
  GPT4: 'gpt-4o',
  GPT4_VISION: 'gpt-4-vision-preview',
  GPT3_5: 'gpt-3.5-turbo'
};

// Create a proxy for OpenAI API calls
export const callOpenAI = async (prompt, options = {}) => {
  try {
    const response = await fetch('https://digihealth-backend.onrender.com/api/analyze-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: prompt,
        ...options 
      })
    });
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
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