import { GoogleGenerativeAI } from "@google/generative-ai";

// Replace with your API key
const API_KEY = "AIzaSyBb5dTovLp13yUQ6kK9GT5QbsKJa7DZRdo";

// Initialize the GoogleGenerativeAI client
const genAI = new GoogleGenerativeAI(API_KEY);

// Export the client
export const gemini = genAI;

// Optional: Export the model if you have a specific one you commonly use
// export const geminiModel = genAI.getGenerativeModel({ model: "YOUR_GEMINI_MODEL_NAME" });