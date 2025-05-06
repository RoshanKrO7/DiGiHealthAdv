// Use local backend for development
const BACKEND_URL = 'http://localhost:5000/api';

export const getChatCompletion = async (messages) => {
  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get chat response');
    }

    const data = await response.json();
    if (!data.message || typeof data.message.text !== 'string') {
      throw new Error('Invalid response format from server');
    }
    return data.message.text;
  } catch (error) {
    console.error('Error getting chat response:', error);
    throw error;
  }
}; 