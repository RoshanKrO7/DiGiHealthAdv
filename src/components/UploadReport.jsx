import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { FaUpload, FaFilePdf, FaFileImage, FaFileAlt } from 'react-icons/fa';

const UploadReport = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [reportType, setReportType] = useState('');
  const [diseases, setDiseases] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState('');
  const [customDisease, setCustomDisease] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    try {
      const { data, error } = await supabase
        .from('diseases')
        .select('*')
        .order('name');

      if (error) throw error;
      setDiseases(data || []);
    } catch (error) {
      console.error('Error fetching diseases:', error);
      setError('Failed to load diseases list');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleDiseaseChange = (e) => {
    const value = e.target.value;
    setSelectedDisease(value);
    if (value !== 'other') {
      setCustomDisease('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user) throw new Error('You must be logged in to upload reports');
      if (!file) throw new Error('Please select a file to upload');

      // Determine the disease name to use
      const diseaseName = selectedDisease === 'other' ? customDisease : 
                         selectedDisease;
      
      if (!diseaseName) throw new Error('Please select or enter a disease');

      // Upload file to Supabase Storage
      const fileExt = fileName.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: fileData, error: fileError } = await supabase.storage
        .from('medical_reports')
        .upload(filePath, file);

      if (fileError) throw fileError;

      // Create record in the reports table
      const { error: reportError } = await supabase
        .from('medical_reports')
        .insert([
          {
            user_id: user.id,
            file_path: filePath,
            file_name: fileName,
            report_type: reportType,
            disease: diseaseName,
            report_date: reportDate,
            description: description,
            uploaded_at: new Date().toISOString()
          }
        ]);

      if (reportError) throw reportError;

      // If it's a new disease, add it to the diseases table
      if (selectedDisease === 'other' && customDisease) {
        const { error: diseaseError } = await supabase
          .from('diseases')
          .insert([{ name: customDisease }]);
        
        if (diseaseError) console.error('Error adding new disease:', diseaseError);
      }

      setSuccess('Report uploaded successfully');
      
      // Reset form
      setFile(null);
      setFileName('');
      setReportType('');
      setSelectedDisease('');
      setCustomDisease('');
      setReportDate('');
      setDescription('');
      
    } catch (error) {
      console.error('Error uploading report:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!fileName) return <FaFileAlt />;
    
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return <FaFilePdf />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <FaFileImage />;
    return <FaFileAlt />;
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Upload Medical Report</h5>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="reportFile" className="form-label">Report File</label>
            <div className="input-group">
              <input
                type="file"
                className="form-control"
                id="reportFile"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                required
              />
              <label className="input-group-text" htmlFor="reportFile">
                <FaUpload />
              </label>
            </div>
            {fileName && (
              <div className="mt-2">
                <span className="badge bg-light text-dark p-2">
                  {getFileIcon()} {fileName}
                </span>
              </div>
            )}
          </div>
          
          <div className="mb-3">
            <label htmlFor="reportType" className="form-label">Report Type</label>
            <select
              className="form-select"
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              required
            >
              <option value="">Select Report Type</option>
              <option value="lab_test">Lab Test</option>
              <option value="imaging">Imaging (X-ray, MRI, CT Scan)</option>
              <option value="prescription">Prescription</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="consultation">Consultation Report</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-3">
            <label htmlFor="disease" className="form-label">Related Disease/Condition</label>
            <select
              className="form-select"
              id="disease"
              value={selectedDisease}
              onChange={handleDiseaseChange}
              required
            >
              <option value="">Select Disease/Condition</option>
              {diseases.map((disease) => (
                <option key={disease.id} value={disease.name}>
                  {disease.name}
                </option>
              ))}
              <option value="other">Other (Specify)</option>
            </select>
          </div>
          
          {selectedDisease === 'other' && (
            <div className="mb-3">
              <label htmlFor="customDisease" className="form-label">Specify Disease/Condition</label>
              <input
                type="text"
                className="form-control"
                id="customDisease"
                value={customDisease}
                onChange={(e) => setCustomDisease(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="mb-3">
            <label htmlFor="reportDate" className="form-label">Report Date</label>
            <input
              type="date"
              className="form-control"
              id="reportDate"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description (Optional)</label>
            <textarea
              className="form-control"
              id="description"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                Upload Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadReport; 