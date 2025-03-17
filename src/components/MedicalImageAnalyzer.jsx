import React, { useState } from 'react';
import { supabase } from '../utils/main';
import { useAuth } from '../contexts/AuthContext';
import { FaUpload, FaSpinner } from 'react-icons/fa';

const MedicalImageAnalyzer = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageType, setImageType] = useState('skin');

  const imageTypes = [
    { value: 'skin', label: 'Skin Condition' },
    { value: 'xray', label: 'X-Ray' },
    { value: 'wound', label: 'Wound/Injury' },
    { value: 'eye', label: 'Eye Condition' }
  ];

  const analyzeImage = async (file) => {
    setLoading(true);
    setError(null);
    try {
      // First, upload the image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('medical-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);

      // Call OpenAI's GPT-4 Vision API for analysis
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "system",
              content: `You are a medical image analyzer specialized in ${imageType} conditions. Provide a detailed analysis while being cautious not to make definitive diagnoses.`
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please analyze this ${imageType} image and provide insights about what you observe. Include potential concerns and recommendations for professional medical consultation if needed.`
                },
                {
                  type: "image_url",
                  image_url: publicUrl
                }
              ]
            }
          ],
          max_tokens: 500
        })
      });

      const data = await response.json();
      
      // Save analysis to database
      const { error: dbError } = await supabase.from('medical_analyses').insert([{
        user_id: user.id,
        image_url: publicUrl,
        analysis_type: imageType,
        analysis_result: data.choices[0].message.content,
        created_at: new Date().toISOString()
      }]);

      if (dbError) throw dbError;

      setResult(data.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      analyzeImage(file);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title mb-4">Medical Image Analysis</h3>

        <div className="mb-3">
          <label className="form-label">Image Type</label>
          <select
            className="form-select"
            value={imageType}
            onChange={(e) => setImageType(e.target.value)}
          >
            {imageTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="form-label">Upload Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={loading}
          />
        </div>

        {loading && (
          <div className="text-center mb-4">
            <FaSpinner className="spinner" />
            <p>Analyzing image...</p>
          </div>
        )}

        {imageUrl && (
          <div className="mb-4">
            <img
              src={imageUrl}
              alt="Uploaded medical image"
              className="img-fluid rounded"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h5>Analysis Results:</h5>
            <div className="card bg-light">
              <div className="card-body">
                <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {result}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalImageAnalyzer; 