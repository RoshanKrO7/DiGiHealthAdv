import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Form, Alert } from 'react-bootstrap';
import { FaQrcode, FaEdit, FaDownload } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const EmergencyQRCode = ({ 
  size = 140, 
  showDownloadButton = true, 
  showHeader = true, 
  showOptions = true,
  showCard = true,
  onClick = null
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState('');
  const [includeAllergies, setIncludeAllergies] = useState(true);
  const [includeDiseases, setIncludeDiseases] = useState(true);
  const [includeContacts, setIncludeContacts] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('EmergencyQRCode mounted, user:', user ? `ID: ${user.id}` : 'No user');
    fetchProfileData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      generateQRData();
    }
  }, [profile, includeAllergies, includeDiseases, includeContacts, includeMedications]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      if (!user) {
        console.error('No user is logged in');
        setLoading(false);
        return;
      }
      
      // Fetch basic profile information
      const { data: profileData, error: profileError } = await supabase
        .from('detailed_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist yet, create a default one
          console.log('Creating new profile for user:', user.id);
        } else {
          throw profileError;
        }
      }

      // Fetch allergies
      const { data: allergiesData, error: allergiesError } = await supabase
        .from('user_allergies')
        .select('*')
        .eq('user_id', user.id);

      if (allergiesError) throw allergiesError;

      // Fetch diseases
      const { data: diseasesData, error: diseasesError } = await supabase
        .from('user_diseases')
        .select('*')
        .eq('user_id', user.id);

      if (diseasesError) throw diseasesError;

      // Fetch medications
      const { data: medicationsData, error: medicationsError } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id);

      if (medicationsError) throw medicationsError;

      setProfile({
        ...profileData,
        allergies: allergiesData || [],
        diseases: diseasesData || [],
        medications: medicationsData || []
      });
      console.log('Profile data loaded:', profileData);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRData = () => {
    if (!profile) return;

    // Add console logging to debug
    console.log('Generating QR data from profile:', profile);

    let emergencyData = {
      name: profile.first_name && profile.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : 'Unknown',
      dob: profile.date_of_birth || 'Unknown',
      bloodType: profile.blood_group || 'Unknown',
      weight: profile.weight ? `${profile.weight} kg` : 'Unknown',
      height: profile.height ? `${profile.height} cm` : 'Unknown'
    };

    if (includeAllergies && profile.allergies && profile.allergies.length > 0) {
      emergencyData.allergies = profile.allergies.map(a => a.allergy_name || a.name);
    }

    if (includeDiseases && profile.diseases && profile.diseases.length > 0) {
      emergencyData.conditions = profile.diseases.map(d => d.disease_name || d.name);
    }

    if (includeContacts && profile.emergency_contact_name) {
      emergencyData.emergencyContact = {
        name: profile.emergency_contact_name,
        phone: profile.emergency_contact_phone,
        relationship: profile.emergency_contact_relationship
      };
    }

    if (includeMedications && profile.medications && profile.medications.length > 0) {
      emergencyData.medications = profile.medications.map(m => ({
        name: m.name,
        dosage: m.daily_dose ? `${m.daily_dose} tablets daily` : 'As prescribed'
      }));
    }

    // Even if we don't have much data, generate a basic QR code
    const qrString = JSON.stringify(emergencyData);
    console.log('QR data generated:', qrString);
    setQrData(qrString);
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('emergency-qrcode');
    if (canvas) {
      try {
        const pngUrl = canvas.toDataURL('image/png');
        
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'emergency-medical-id.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } catch (error) {
        console.error('Error downloading QR code:', error);
      }
    }
  };

  const handleProfileRedirect = () => {
    navigate('/profile?section=emergency-qr');
  };

  if (loading) {
    return (
      <div className="text-center">
        <Spinner animation="border" role="status" size="sm">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const qrCodeContent = (
    <>
      <div className={`qrcode-container p-2 bg-light rounded ${onClick ? 'cursor-pointer' : ''}`} 
           onClick={onClick || (showCard ? null : () => handleProfileRedirect())}
           style={{
             display: 'flex', 
             justifyContent: 'center', 
             alignItems: 'center', 
             height: size + 20, 
             width: size + 20,
             margin: '0 auto'
            }}>
        {qrData ? (
          <QRCodeCanvas
            id="emergency-qrcode"
            value={qrData}
            size={size}
            level="H"
            includeMargin={true}
          />
        ) : (
          <div style={{width: size, height: size}} className="d-flex justify-content-center align-items-center border rounded">
            <div className="text-center p-2">
              <FaQrcode size={size/3} className="text-muted mb-2" />
              <p className="small text-muted mb-0">Set up your profile to create emergency QR</p>
            </div>
          </div>
        )}
      </div>
      
      {showDownloadButton && qrData && (
        <div className="mt-3 d-flex flex-wrap gap-2 justify-content-center">
          <Button 
            variant="primary" 
            size="sm"
            className="d-flex align-items-center"
            onClick={downloadQRCode}
          >
            <FaDownload className="me-1" /> Download QR Code
          </Button>
        </div>
      )}
    </>
  );

  if (!showCard) {
    return qrCodeContent;
  }

  return (
    <div className="my-4">
      <Card className="shadow">
        {showHeader && (
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FaQrcode className="me-2" />
              <h5 className="mb-0">Emergency Medical QR Code</h5>
            </div>
            <Button
              variant="outline-light"
              size="sm"
              className="d-flex align-items-center"
              onClick={handleProfileRedirect}
            >
              <FaEdit className="me-1" /> Manage
            </Button>
          </Card.Header>
        )}
        <Card.Body className="d-flex flex-column align-items-center">
          {showHeader && (
            <div className="text-center mb-3">
              <p>This QR code contains your essential medical information for emergency situations.</p>
            </div>
          )}
          
          {qrCodeContent}
          
          {showOptions && (
            <div className="mt-4 w-100">
              <h6>Information Included:</h6>
              <Form>
                <div className="d-flex flex-wrap gap-3">
                  <Form.Check 
                    type="switch"
                    id="include-allergies"
                    label="Allergies"
                    checked={includeAllergies}
                    onChange={e => setIncludeAllergies(e.target.checked)}
                  />
                  <Form.Check 
                    type="switch"
                    id="include-diseases"
                    label="Medical Conditions"
                    checked={includeDiseases}
                    onChange={e => setIncludeDiseases(e.target.checked)}
                  />
                  <Form.Check 
                    type="switch"
                    id="include-contacts"
                    label="Emergency Contacts"
                    checked={includeContacts}
                    onChange={e => setIncludeContacts(e.target.checked)}
                  />
                  <Form.Check 
                    type="switch"
                    id="include-medications"
                    label="Medications"
                    checked={includeMedications}
                    onChange={e => setIncludeMedications(e.target.checked)}
                  />
                </div>
              </Form>
            </div>
          )}
          
          <Alert variant="info" className="mt-3">
            <small>Keep your profile information up-to-date for effective emergency response.</small>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EmergencyQRCode; 