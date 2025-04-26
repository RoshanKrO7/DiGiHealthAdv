import { supabase } from './supabaseClient';

// Common health parameters and their variations
const PARAMETER_PATTERNS = {
  weight: [/weight\s*[:=]?\s*(\d+\.?\d*)\s*(kg|kilograms|kgs)/i, /(\d+\.?\d*)\s*(kg|kilograms|kgs)/i],
  height: [/height\s*[:=]?\s*(\d+\.?\d*)\s*(cm|centimeters)/i, /(\d+\.?\d*)\s*(cm|centimeters)/i],
  bloodPressure: [/bp\s*[:=]?\s*(\d+)[\/\\](\d+)/i, /blood pressure\s*[:=]?\s*(\d+)[\/\\](\d+)/i],
  systolicBP: [/systolic\s*[:=]?\s*(\d+)/i],
  diastolicBP: [/diastolic\s*[:=]?\s*(\d+)/i],
  heartRate: [/heart rate\s*[:=]?\s*(\d+)/i, /pulse\s*[:=]?\s*(\d+)/i, /hr\s*[:=]?\s*(\d+)/i],
  temperature: [/temperature\s*[:=]?\s*(\d+\.?\d*)/i, /temp\s*[:=]?\s*(\d+\.?\d*)/i],
  glucose: [/glucose\s*[:=]?\s*(\d+\.?\d*)/i, /blood sugar\s*[:=]?\s*(\d+\.?\d*)/i],
  cholesterol: [/cholesterol\s*[:=]?\s*(\d+\.?\d*)/i, /total cholesterol\s*[:=]?\s*(\d+\.?\d*)/i],
  hdl: [/hdl\s*[:=]?\s*(\d+\.?\d*)/i, /hdl cholesterol\s*[:=]?\s*(\d+\.?\d*)/i],
  ldl: [/ldl\s*[:=]?\s*(\d+\.?\d*)/i, /ldl cholesterol\s*[:=]?\s*(\d+\.?\d*)/i],
  triglycerides: [/triglycerides\s*[:=]?\s*(\d+\.?\d*)/i, /tg\s*[:=]?\s*(\d+\.?\d*)/i],
  hemoglobin: [/h[ae]moglobin\s*[:=]?\s*(\d+\.?\d*)/i, /hb\s*[:=]?\s*(\d+\.?\d*)/i],
  hba1c: [/hba1c\s*[:=]?\s*(\d+\.?\d*)/i, /a1c\s*[:=]?\s*(\d+\.?\d*)/i]
};

// Parameter units for storage
const PARAMETER_UNITS = {
  weight: 'kg',
  height: 'cm',
  bloodPressure: 'mmHg',
  systolicBP: 'mmHg',
  diastolicBP: 'mmHg',
  heartRate: 'bpm',
  temperature: '°C',
  glucose: 'mg/dL',
  cholesterol: 'mg/dL',
  hdl: 'mg/dL',
  ldl: 'mg/dL',
  triglycerides: 'mg/dL',
  hemoglobin: 'g/dL',
  hba1c: '%'
};

// Readable names for parameters
const PARAMETER_DISPLAY_NAMES = {
  weight: 'Weight',
  height: 'Height',
  bloodPressure: 'Blood Pressure',
  systolicBP: 'Systolic BP',
  diastolicBP: 'Diastolic BP',
  heartRate: 'Heart Rate',
  temperature: 'Body Temperature',
  glucose: 'Blood Glucose',
  cholesterol: 'Total Cholesterol',
  hdl: 'HDL Cholesterol',
  ldl: 'LDL Cholesterol',
  triglycerides: 'Triglycerides',
  hemoglobin: 'Hemoglobin',
  hba1c: 'HbA1c'
};

// Main extraction function
export const extractHealthParameters = async (textContent) => {
  const extractedParams = {};

  // Extract parameters using regex patterns
  for (const [paramKey, patterns] of Object.entries(PARAMETER_PATTERNS)) {
    for (const pattern of patterns) {
      const match = textContent.match(pattern);
      if (match) {
        if (paramKey === 'bloodPressure' && match[1] && match[2]) {
          // Special case for blood pressure which has two numbers
          extractedParams.systolicBP = match[1];
          extractedParams.diastolicBP = match[2];
          extractedParams[paramKey] = `${match[1]}/${match[2]}`;
        } else if (match[1]) {
          extractedParams[paramKey] = match[1];
        }
        break; // Stop after first match for this parameter
      }
    }
  }

  return extractedParams;
};

// Save extracted parameters to the database
export const saveExtractedParameters = async (userId, extractedParams, reportId = null) => {
  try {
    const now = new Date().toISOString();
    const parametersToInsert = [];

    for (const [paramKey, value] of Object.entries(extractedParams)) {
      // Skip bloodPressure since we save systolic and diastolic separately
      if (paramKey === 'bloodPressure') continue;
      
      parametersToInsert.push({
        user_id: userId,
        parameter_name: PARAMETER_DISPLAY_NAMES[paramKey] || paramKey,
        value: value,
        unit: PARAMETER_UNITS[paramKey] || '',
        date_recorded: now,
        source: 'report',
        report_id: reportId
      });
    }

    if (parametersToInsert.length === 0) return { success: false, message: 'No parameters to save' };

    const { data, error } = await supabase
      .from('user_parameters')
      .insert(parametersToInsert)
      .select();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error saving parameters:', error);
    return { success: false, error };
  }
};

// Process report text and save parameters
export const processAndSaveReportParameters = async (userId, reportText, reportId) => {
  try {
    // Extract parameters from the report text
    const extractedParams = await extractHealthParameters(reportText);
    
    // Save to database
    const result = await saveExtractedParameters(userId, extractedParams, reportId);
    
    // Update the report with extracted parameters
    if (result.success && reportId) {
      await supabase
        .from('user_reports')
        .update({ 
          extracted_parameters: extractedParams,
          processing_status: 'completed'
        })
        .eq('id', reportId);
    }
    
    return { success: result.success, extractedParams };
  } catch (error) {
    console.error('Error processing report:', error);
    
    // Update report status to failed
    if (reportId) {
      await supabase
        .from('user_reports')
        .update({ 
          processing_status: 'failed',
          processing_error: error.message
        })
        .eq('id', reportId);
    }
    
    return { success: false, error };
  }
};

// Process a report file using OCR (this would connect to a serverless function)
export const processReportFile = async (userId, fileUrl, fileName, reportId) => {
  try {
    // In a real implementation, this would call an OCR service
    // For now, we'll simulate with a placeholder
    const simulatedText = `Patient Report
    Date: ${new Date().toLocaleDateString()}
    
    Weight: 75.2 kg
    Height: 178 cm
    Blood Pressure: 120/80
    Heart Rate: 72 bpm
    Glucose: 95 mg/dL
    Cholesterol: 185 mg/dL
    `;
    
    // Set report as processing
    await supabase
      .from('user_reports')
      .update({ processing_status: 'processing' })
      .eq('id', reportId);
    
    // Process the extracted text
    return await processAndSaveReportParameters(userId, simulatedText, reportId);
  } catch (error) {
    console.error('Error processing file:', error);
    return { success: false, error };
  }
};

// Get health parameter history for a user
export const getParameterHistory = async (userId, parameterName, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('user_parameters')
      .select('*')
      .eq('user_id', userId)
      .eq('parameter_name', parameterName)
      .order('date_recorded', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching parameter history:', error);
    return { success: false, error };
  }
}; 