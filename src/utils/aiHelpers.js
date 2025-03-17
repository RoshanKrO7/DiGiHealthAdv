import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

export const getHealthInsights = async (symptoms, medicalHistory) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful medical assistant. Provide general health insights and suggestions. Always remind users to consult healthcare professionals for proper medical advice."
        },
        {
          role: "user",
          content: `Based on these symptoms: ${symptoms} and medical history: ${medicalHistory}, what general health insights can you provide?`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting health insights:', error);
    throw error;
  }
};

export const analyzeMedicalReport = async (reportText) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a medical report analyzer. Summarize and explain medical reports in simple terms."
        },
        {
          role: "user",
          content: `Please analyze and summarize this medical report in simple terms: ${reportText}`
        }
      ],
      temperature: 0.5,
      max_tokens: 800
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing medical report:', error);
    throw error;
  }
};

export const getHealthRecommendations = async (userProfile, healthMetrics) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a health recommendation system. Provide personalized health and lifestyle recommendations based on user data."
        },
        {
          role: "user",
          content: `Based on this profile: ${JSON.stringify(userProfile)} and health metrics: ${JSON.stringify(healthMetrics)}, what health recommendations can you provide?`
        }
      ],
      temperature: 0.6,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting health recommendations:', error);
    throw error;
  }
}; 