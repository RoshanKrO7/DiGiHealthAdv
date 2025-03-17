import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Card, Container, Row, Col } from 'react-bootstrap';
import { supabase } from '../utils/main';
import Spinner from '../components/Spinner';
import 'bootstrap/dist/css/bootstrap.min.css';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';
import OpenAI from 'openai';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Initialize the OpenAI client (near the top of your file with other imports)
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY, // Store this in your .env file
  dangerouslyAllowBrowser: true // For client-side usage (consider moving to backend in production)
});

const HealthOverview = () => {
  const [healthData, setHealthData] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userDetails, setUserDetails] = useState({ first_name: '', last_name: '', email: '' });
  const [showModal, setShowModal] = useState(false);
  const [newReport, setNewReport] = useState({ 
    disease_id: '', 
    since: '', 
    file: null 
  });
  const [preview, setPreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userDiseases, setUserDiseases] = useState([]);
  const [userParameters, setUserParameters] = useState([]);
  const [extractedParameters, setExtractedParameters] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return;
      if (user) {
        setUserId(user.id);
        fetchHealthData(user.id);
        fetchUserDetails(user.id);
        fetchUserDiseases(user.id);
        fetchUserParameters(user.id);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const fetchUserDiseases = async (uid) => {
    const { data, error } = await supabase
      .from('user_diseases')
      .select('*')
      .eq('user_id', uid);
    if (!error) setUserDiseases(data);
  };

  const fetchUserParameters = async (uid) => {
    const { data, error } = await supabase
      .from('user_parameters')
      .select('*')
      .eq('user_id', uid);
    if (!error) setUserParameters(data);
  };

  const fetchUserDetails = async (uid) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', uid)
      .single();
    if (!error) setUserDetails(data);
  };

  const fetchHealthData = async (uid) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('healthrecords')
      .select(`
        *,
        user_diseases(disease_name)
      `)
      .eq('user_id', uid);
    if (!error) setHealthData(data);
    setLoading(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setNewReport({ ...newReport, file });
    
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      }

      // Extract parameters from the file
      try {
        const extractedData = await extractParametersFromFile(file);
        setExtractedParameters(extractedData);
      } catch (error) {
        console.error('Error extracting parameters:', error);
        setNotification({ message: 'Error extracting parameters from file', type: 'danger' });
      }
    }
  };

  const extractParametersFromFile = async (file) => {
    try {
      let text = '';
      
      // Your existing code to extract text from different file types
      if (file.type.startsWith('image/')) {
        const { data: { text: extractedText } } = await Tesseract.recognize(
          URL.createObjectURL(file),
          'eng',
          { logger: m => console.log(m) }
        );
        text = extractedText;
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Process each page
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          
          // Try to get text content first (for native PDFs)
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          
          // If page has very little text, it might be a scanned page
          // In that case, render it and use OCR
          if (pageText.trim().length < 100) {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
            
            const { data: { text: ocrText } } = await Tesseract.recognize(
              canvas.toDataURL('image/png'),
              'eng',
              { logger: m => console.log(m) }
            );
            text += ocrText + '\n';
          } else {
            text += pageText + '\n';
          }
        }
      } else {
        text = await file.text();
      }

      // Your existing regex extraction
      const extractedData = {};
      userParameters.forEach(param => {
        const pattern = new RegExp(`${param.parameter_name}\\s*[:=]\\s*([\\d.]+)`, 'i');
        const match = text.match(pattern);
        if (match) {
          extractedData[param.parameter_name] = match[1];
        }
      });

      // Enhance with OpenAI if the text has sufficient content
      if (text.length > 50) {
        const enhancedResult = await enhanceWithOpenAI(text, extractedData);
        return enhancedResult;
      }

      return { parameters: extractedData };
    } catch (error) {
      console.error('Error extracting parameters:', error);
      throw error;
    }
  };

  // Add this new function to your component
  const enhanceWithOpenAI = async (text, extractedParams) => {
    try {
      // Create a system prompt for health data extraction
      const prompt = `
        You are a medical data extraction assistant. Extract relevant health parameters from the following medical report.
        If you find any of these parameters, provide their values: blood pressure, heart rate, cholesterol, glucose, BMI, A1C, triglycerides, HDL, LDL.
        Also identify any mentioned medical conditions, medications, or doctor's recommendations.
        
        Document text:
        ${text}
        
        Format your response as a JSON object with these keys:
        "parameters" (key-value pairs of parameter names and values)
        "conditions" (array of identified conditions)
        "medications" (array of medications with dosages if available)
        "recommendations" (key points from doctor's recommendations)
        "summary" (2-3 sentence summary of the document)
      `;

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a medical data extraction assistant that outputs only valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      // Parse the response
      const result = JSON.parse(response.choices[0].message.content);
      
      // Merge with regex-extracted parameters (prioritizing OpenAI for conflicts)
      const enhancedParams = {
        ...extractedParams,
        ...result.parameters
      };
      
      return {
        parameters: enhancedParams,
        aiAnalysis: {
          conditions: result.conditions || [],
          medications: result.medications || [],
          recommendations: result.recommendations || [],
          summary: result.summary || ""
        }
      };
    } catch (error) {
      console.error('Error enhancing with OpenAI:', error);
      // Return original extracted params if OpenAI enhancement fails
      return { parameters: extractedParams, aiAnalysis: null };
    }
  };

  // Update your handleSubmit function to store AI analysis
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      // Upload file to Supabase Storage
      const fileExt = newReport.file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('health-reports')
        .upload(fileName, newReport.file);
  
      if (uploadError) throw uploadError;
  
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health-reports')
        .getPublicUrl(fileName);
  
      // Insert report into healthrecords
      const { data: reportData, error: reportError } = await supabase
        .from('healthrecords')
        .insert([{
          user_id: userId,
          disease_id: newReport.disease_id,
          since: newReport.since,
          document_url: publicUrl,
          created_at: new Date().toISOString(),
          ai_summary: extractedParameters.aiAnalysis?.summary || null
        }])
        .select()
        .single();
  
      if (reportError) throw reportError;
  
      // Save extracted parameters
      if (extractedParameters.parameters && Object.keys(extractedParameters.parameters).length > 0) {
        const parameterRecords = Object.entries(extractedParameters.parameters).map(([name, value]) => ({
          report_id: reportData.id,
          parameter_name: name,
          parameter_value: value
        }));
  
        const { error: paramError } = await supabase
          .from('report_parameters')
          .insert(parameterRecords);
  
        if (paramError) throw paramError;
      }
      
      // If we have AI analysis, save it too
      if (extractedParameters.aiAnalysis) {
        const { error: aiError } = await supabase
          .from('report_ai_analysis')
          .insert([{
            report_id: reportData.id,  // This should now be a UUID, not an integer
            conditions: extractedParameters.aiAnalysis.conditions,
            medications: extractedParameters.aiAnalysis.medications,
            recommendations: extractedParameters.aiAnalysis.recommendations,
            summary: extractedParameters.aiAnalysis.summary
          }]);
          
        if (aiError) throw aiError;
      }
  
      setNotification({ message: 'Report uploaded successfully!', type: 'success' });
      setShowModal(false);
      fetchHealthData(userId);
    } catch (error) {
      console.error('Error uploading report:', error);
      setNotification({ message: 'Error uploading report', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      {loading && <Spinner />}
      {notification && (
        <div className={`alert alert-${notification.type}`} role="alert">
          {notification.message}
        </div>
      )}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary">Health Reports</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Upload Report</Button>
      </div>
      
      <Row>
        {healthData.map((report) => (
          <Col md={3} sm={6} key={report.id} className="mb-3">
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title>Disease: {report.user_diseases?.disease_name}</Card.Title>
                <Card.Text>Since: {report.since}</Card.Text>
                <div className="d-flex justify-content-between">
                  <Button variant="danger" size="md" className='m-2' onClick={() => console.log('Delete', report.id)}>Delete</Button>
                  <Button variant="info" size="md" className='m-2' onClick={() => window.open(report.document_url, '_blank')}>View</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Upload New Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Select Disease</Form.Label>
              <Form.Select 
                value={newReport.disease_id}
                onChange={(e) => setNewReport({ ...newReport, disease_id: e.target.value })}
                required
              >
                <option value="">Select a disease</option>
                {userDiseases.map((disease) => (
                  <option key={disease.id} value={disease.id}>
                    {disease.disease_name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Since</Form.Label>
              <Form.Control 
                type="date" 
                value={newReport.since}
                onChange={(e) => setNewReport({ ...newReport, since: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Upload File</Form.Label>
              <Form.Control 
                type="file" 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                onChange={handleFileChange}
                required
              />
            </Form.Group>
            {preview && <img src={preview} alt="Preview" className="img-fluid rounded mb-3" />}
            
            {/* Display extracted parameters */}
            {extractedParameters.parameters && Object.keys(extractedParameters.parameters).length > 0 && (
              <div className="mb-3">
                <h5>Extracted Parameters:</h5>
                <ul className="list-group">
                  {Object.entries(extractedParameters.parameters).map(([name, value]) => (
                    <li key={name} className="list-group-item">
                      {name}: {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Display AI analysis */}
            {extractedParameters.aiAnalysis && (
              <div className="mb-3">
                <h5>AI Analysis</h5>
                <div className="card">
                  <div className="card-body">
                    <h6>Summary</h6>
                    <p>{extractedParameters.aiAnalysis.summary}</p>
                    
                    {extractedParameters.aiAnalysis.conditions?.length > 0 && (
                      <>
                        <h6>Identified Conditions</h6>
                        <ul>
                          {extractedParameters.aiAnalysis.conditions.map((condition, i) => (
                            <li key={i}>{condition}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {extractedParameters.aiAnalysis.medications?.length > 0 && (
                      <>
                        <h6>Medications</h6>
                        <ul>
                          {extractedParameters.aiAnalysis.medications.map((med, i) => (
                            <li key={i}>{med}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {extractedParameters.aiAnalysis.recommendations && (
                      <>
                        <h6>Recommendations</h6>
                        <p>{extractedParameters.aiAnalysis.recommendations}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Report'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default HealthOverview;
