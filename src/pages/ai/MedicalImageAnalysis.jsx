import React, { useState, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient'; // Make sure this path is correct
import Spinner from '../../components/Spinner'; // Make sure this path is correct
import { openai, MODELS } from '../../utils/openai';
import './MedicalImageAnalysis.css';

const MedicalImageAnalysis = () => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [analysisType, setAnalysisType] = useState('general');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setNotification({
        type: 'danger',
        message: 'Please upload a valid image file (JPEG, PNG, etc.)'
      });
      return;
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setResults(null);
    setError(null);
  };

  const resetForm = () => {
    setImage(null);
    setImagePreview(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAnalysisPrompt = (type) => {
    const basePrompt = "You are a medical imaging specialist AI. Analyze this medical image and provide detailed observations. ";
    
    const prompts = {
      'general': basePrompt + "Describe what you see, potential abnormalities, and possible conditions it might indicate. Be thorough but cautious about making definitive diagnoses.",
      'skin': basePrompt + "This is a skin-related image. Describe the lesion/condition characteristics, possible differential diagnoses, and any concerning features. Mention if further evaluation is recommended.",
      'xray': basePrompt + "This is an X-ray image. Describe the visible structures, any abnormalities, potential fractures, lesions, or other findings. Interpret the image as thoroughly as possible.",
      'scan': basePrompt + "This is a CT/MRI scan. Describe the visible anatomical structures, any abnormalities, masses, inflammations, or other noteworthy findings. Provide detailed analysis of tissue characteristics.",
      'pathology': basePrompt + "This is a pathology slide. Describe the cellular structures, any abnormal cells, patterns, or markers of disease. Analyze tissue architecture and cellular morphology."
    };
    
    return prompts[type] || prompts['general'];
  };

  const getDisclaimer = (type) => {
    const baseDisclaimer = "This AI analysis is not a substitute for professional medical diagnosis. Please consult with a healthcare provider for proper evaluation and diagnosis.";
    
    const disclaimers = {
      'skin': baseDisclaimer + " Skin conditions particularly require in-person examination as many can appear similar in images.",
      'xray': baseDisclaimer + " X-ray interpretation requires board-certified radiologists for official diagnosis.",
      'scan': baseDisclaimer + " CT/MRI scans are complex and require specialized medical training to properly diagnose.",
      'pathology': baseDisclaimer + " Pathology diagnosis requires microscopic examination by a certified pathologist."
    };
    
    return disclaimers[type] || baseDisclaimer;
  };

  const analyzeImage = async () => {
    if (!image) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(image);
      
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        try {
          // Call OpenAI Vision API
          const response = await openai.chat.completions.create({
            model: MODELS.GPT4_VISION,
            messages: [
              {
                role: 'system',
                content: getAnalysisPrompt(analysisType)
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Please analyze this medical image.' },
                  { type: 'image_url', image_url: { url: base64Image } }
                ]
              }
            ],
            max_tokens: 1000,
          });
          
          // Save results
          setResults({
            analysis: response.choices[0].message.content,
            date: new Date().toISOString(),
            disclaimer: getDisclaimer(analysisType),
            imageType: analysisType
          });
          
          // Save analysis to database
          saveAnalysisToDatabase(response.choices[0].message.content);
          
        } catch (apiError) {
          console.error('OpenAI API error:', apiError);
          setError('Error analyzing image. Please try again or use a different image.');
        }
        
        setLoading(false);
      };
      
      reader.onerror = () => {
        setError('Error reading image file. Please try again with a different image.');
        setLoading(false);
      };
      
    } catch (e) {
      console.error('Error processing image:', e);
      setError('Error processing image. Please try again.');
      setLoading(false);
    }
  };

  const saveAnalysisToDatabase = async (analysisText) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Save image to storage
      const fileExt = image.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('medical-images')
        .upload(fileName, image);
        
      if (uploadError) throw uploadError;
      
      // Get image URL
      const { data: { publicUrl } } = supabase.storage
        .from('medical-images')
        .getPublicUrl(fileName);
      
      // Save analysis to database
      await supabase
        .from('image_analyses')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          analysis_type: analysisType,
          analysis_result: analysisText,
          created_at: new Date().toISOString()
        });
        
    } catch (error) {
      console.error('Error saving analysis:', error);
      // Continue anyway since this is just for saving history
    }
  };

  return (
    <div className="container-fluid py-4">
      {notification && (
        <div className={`alert alert-${notification.type} alert-dismissible fade show`}>
          {notification.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setNotification(null)}
          ></button>
        </div>
      )}

      <h1 className="mb-4">Medical Image Analysis</h1>
      
      <div className="row">
        <div className="col-lg-6">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title">Upload Medical Image</h5>
              <p className="card-text text-muted">
                Upload a medical image for AI analysis. 
                Supported types: X-rays, skin conditions, CT/MRI scans, pathology slides.
              </p>
              
              <div className="mb-3">
                <label htmlFor="analysisType" className="form-label">Analysis Type</label>
                <select 
                  id="analysisType"
                  className="form-select"
                  value={analysisType}
                  onChange={(e) => setAnalysisType(e.target.value)}
                >
                  <option value="general">General Medical Image Analysis</option>
                  <option value="skin">Skin Condition/Lesion</option>
                  <option value="xray">X-Ray</option>
                  <option value="scan">CT/MRI Scan</option>
                  <option value="pathology">Pathology Slide</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="imageUpload" className="form-label">Upload Image</label>
                <input
                  type="file"
                  className="form-control"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
              </div>
              
              {imagePreview && (
                <div className="mb-3 text-center">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="img-fluid mb-2 border rounded"
                    style={{ maxHeight: '300px' }} 
                  />
                </div>
              )}
              
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-primary" 
                  onClick={analyzeImage}
                  disabled={!image || loading}
                >
                  {loading ? <><Spinner size="sm" /> Analyzing...</> : 'Analyze Image'}
                </button>
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={resetForm}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-6">
          {loading ? (
            <div className="card shadow-sm mb-4">
              <div className="card-body text-center py-5">
                <Spinner />
                <p className="mt-3">Analyzing your medical image...</p>
                <p className="text-muted small">This may take a moment</p>
              </div>
            </div>
          ) : results ? (
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">Analysis Results</h5>
              </div>
              <div className="card-body">
                <div className="analysis-content">
                  {results.analysis.split('\n').map((paragraph, idx) => (
                    paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
                  ))}
                </div>
                <div className="alert alert-warning mt-3">
                  <strong>Important Disclaimer:</strong> {results.disclaimer}
                </div>
              </div>
              <div className="card-footer text-muted">
                <small>Analysis generated on {new Date(results.date).toLocaleString()}</small>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              {error}
            </div>
          ) : (
            <div className="card shadow-sm mb-4">
              <div className="card-body p-5 text-center">
                <div className="text-muted mb-3">
                  <i className="fas fa-microscope fa-3x"></i>
                </div>
                <h5>Upload an image to see analysis results</h5>
                <p className="text-muted">
                  The AI will analyze your medical image and provide insights.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <h5>About Medical Image Analysis</h5>
            <p>
              This feature uses AI to analyze various types of medical images. 
              Please note that this is not a substitute for professional medical diagnosis.
              Always consult with a healthcare provider for proper evaluation.
            </p>
            <div className="row g-4 mt-2">
              <div className="col-md-6">
                <h6>Common Uses</h6>
                <ul>
                  <li>Preliminary analysis of skin conditions</li>
                  <li>Identifying potential areas of concern in X-rays</li>
                  <li>Understanding CT/MRI scan information</li>
                  <li>Analyzing pathology slides</li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Limitations</h6>
                <ul>
                  <li>Not a replacement for professional diagnosis</li>
                  <li>Quality of analysis depends on image quality</li>
                  <li>May not detect all conditions or abnormalities</li>
                  <li>Should be used for educational purposes only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalImageAnalysis;