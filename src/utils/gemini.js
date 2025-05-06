import { GoogleGenerativeAI } from "@google/generative-ai";

// Temporary API key for testing
const API_KEY = 'AIzaSyBb5dTovLp13yUQ6kK9GT5QbsKJa7DZRdo';

// Initialize the GoogleGenerativeAI client with the correct API version
const genAI = new GoogleGenerativeAI(API_KEY, {
  apiVersion: 'v1'
});

// Export the client
export const gemini = genAI;

// Export a helper function to get the model
export const getGeminiModel = (modelName = "gemini-1.0-pro") => {
  try {
    if (!API_KEY) {
      throw new Error('Gemini API key is not configured');
    }
    return genAI.getGenerativeModel({ model: modelName });
  } catch (error) {
    console.error('Error initializing Gemini model:', error);
    throw error;
  }
};