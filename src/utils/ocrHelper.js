import { createWorker } from 'tesseract.js';
import { parseDocument } from 'medical-report-parser'; // This is a hypothetical package name

export const extractMedicalParameters = async (imageFile) => {
  const worker = await createWorker();
  
  try {
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(imageFile);
    
    // Extract parameters (example patterns)
    const parameters = {
      bloodPressure: extractPattern(text, /BP:\s*(\d+\/\d+)/i),
      bloodSugar: extractPattern(text, /Blood Sugar:\s*(\d+(\.\d+)?)/i),
      cholesterol: extractPattern(text, /Cholesterol:\s*(\d+(\.\d+)?)/i),
      heartRate: extractPattern(text, /Heart Rate:\s*(\d+)/i),
      temperature: extractPattern(text, /Temperature:\s*([\d.]+)/i),
      weight: extractPattern(text, /Weight:\s*([\d.]+)/i),
      height: extractPattern(text, /Height:\s*([\d.]+)/i),
      oxygenSaturation: extractPattern(text, /SpO2:\s*(\d+%)/i)
    };

    return {
      rawText: text,
      parameters,
      timestamp: new Date().toISOString()
    };
  } finally {
    await worker.terminate();
  }
};

const extractPattern = (text, pattern) => {
  const match = text.match(pattern);
  return match ? match[1] : null;
};

export const saveParametersToDatabase = async (supabase, userId, parameters) => {
  try {
    const { error } = await supabase.from('health_metrics').insert([{
      user_id: userId,
      recorded_at: parameters.timestamp,
      metrics: parameters.parameters,
      source: 'ocr',
      raw_text: parameters.rawText
    }]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving parameters:', error);
    throw error;
  }
}; 