import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import { Card, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { format, parseISO, subMonths } from 'date-fns';
import { FaChartLine, FaHeartbeat, FaWeight, FaRuler, FaFileMedical, FaCalendarAlt, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Register Chart.js components
Chart.register(...registerables);

const HealthAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [parameters, setParameters] = useState([]);
  const [paramTypes, setParamTypes] = useState([]);
  const [selectedParam, setSelectedParam] = useState('');
  const [timeRange, setTimeRange] = useState('6months');
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    if (user) {
      fetchParameters();
      fetchRecentReports();
    }
  }, [user]);

  useEffect(() => {
    if (parameters.length > 0) {
      // Get unique parameter types
      const types = [...new Set(parameters.map(p => p.parameter_name))];
      setParamTypes(types);
      
      if (types.length > 0 && !selectedParam) {
        setSelectedParam(types[0]);
      } else if (types.length === 0) {
        setShowEmptyState(true);
      }
    } else {
      setShowEmptyState(true);
    }
    setLoading(false);
  }, [parameters]);

  useEffect(() => {
    if (selectedParam) {
      prepareChartData();
    }
  }, [selectedParam, timeRange, parameters]);

  const fetchParameters = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('user_parameters')
        .select('*')
        .eq('user_id', user.id)
        .order('date_recorded', { ascending: true });
        
      if (error) throw error;
      setParameters(data || []);
    } catch (err) {
      console.error('Error fetching parameters:', err);
      setError('Failed to load your health parameters. Please try again later.');
    }
  };

  const fetchRecentReports = async () => {
    try {
      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      setRecentReports(data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const prepareChartData = () => {
    // Filter based on selected parameter
    const filteredParams = parameters.filter(p => p.parameter_name === selectedParam);
    
    // Apply time range filter
    const cutoffDate = new Date();
    switch (timeRange) {
      case '1month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(cutoffDate.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(cutoffDate.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
        break;
      default:
        // No cutoff - all data
        cutoffDate.setFullYear(1900);
    }
    
    const timeFilteredParams = filteredParams.filter(p => 
      new Date(p.date_recorded) > cutoffDate
    );
    
    if (timeFilteredParams.length === 0) {
      setChartData(null);
      return;
    }

    // Get unit from the first record
    const unit = timeFilteredParams[0].unit || '';
    
    // Format dates and prepare chart data
    const dates = timeFilteredParams.map(p => format(new Date(p.date_recorded), 'MMM dd, yyyy'));
    const values = timeFilteredParams.map(p => parseFloat(p.value));
    
    // Calculate trend line (simple average of previous points)
    const trendValues = values.map((_, idx) => {
      const prevValues = values.slice(0, idx + 1);
      return prevValues.reduce((sum, val) => sum + val, 0) / prevValues.length;
    });
    
    const data = {
      labels: dates,
      datasets: [
        {
          label: `${selectedParam} (${unit})`,
          data: values,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        },
        {
          label: 'Trend',
          data: trendValues,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderDash: [5, 5],
          backgroundColor: 'rgba(255, 99, 132, 0)',
          tension: 0.4,
          fill: false,
          pointRadius: 0,
        }
      ]
    };
    
    setChartData(data);
  };

  const getIconForParameter = (paramName) => {
    const nameLower = paramName.toLowerCase();
    if (nameLower.includes('weight')) return <FaWeight />;
    if (nameLower.includes('height')) return <FaRuler />;
    if (nameLower.includes('heart') || nameLower.includes('pulse') || nameLower.includes('bp')) return <FaHeartbeat />;
    return <FaChartLine />;
  };

  const goToUploadReport = () => {
    navigate('/health-records', { state: { openUpload: true } });
  };

  const getRecentValue = (paramName) => {
    const filtered = parameters.filter(p => p.parameter_name === paramName);
    if (filtered.length === 0) return 'No data';
    
    // Sort by date to get most recent
    const sorted = [...filtered].sort((a, b) => 
      new Date(b.date_recorded) - new Date(a.date_recorded)
    );
    
    return `${sorted[0].value} ${sorted[0].unit || ''}`;
  };

  if (loading) return <Spinner />;

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col">
          <h1 className="h3">Health Analytics</h1>
          <p className="text-muted">Track trends in your health parameters over time</p>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {showEmptyState && parameters.length === 0 ? (
        <div className="text-center py-5">
          <Card className="shadow p-4">
            <Card.Body>
              <FaFileMedical size={50} className="text-muted mb-3" />
              <h4>No Health Parameters Found</h4>
              <p className="text-muted">
                Upload medical reports to automatically extract and track health parameters over time.
              </p>
              <Button onClick={goToUploadReport} className="mt-3">
                <FaFileMedical className="me-2" /> Upload Medical Report
              </Button>
            </Card.Body>
          </Card>
        </div>
      ) : (
        <>
          {/* Parameter Key Stats */}
          <Row className="mb-4">
            {paramTypes.slice(0, 4).map((param, index) => (
              <Col key={index} md={3} sm={6} xs={12} className="mb-3">
                <Card className="hover-card h-100">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                      <div className={`icon-circle bg-primary text-white`}>
                        {getIconForParameter(param)}
                      </div>
                      <h5 className="card-title mb-0 ms-3">{param}</h5>
                    </div>
                    <div className="mt-2">
                      <h4 className="text-center">{getRecentValue(param)}</h4>
                      <p className="text-muted text-center small mb-0">Latest reading</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {/* Chart Section */}
          <Row className="mb-4">
            <Col>
              <Card className="shadow">
                <Card.Header className="bg-white py-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <div className="d-flex align-items-center mb-2 mb-md-0">
                      <FaChartLine className="me-2 text-primary" />
                      <h5 className="mb-0">Parameter Trends</h5>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <Form.Select 
                        value={selectedParam} 
                        onChange={(e) => setSelectedParam(e.target.value)}
                        className="me-2"
                        style={{ width: 'auto' }}
                      >
                        {paramTypes.map((type, index) => (
                          <option key={index} value={type}>{type}</option>
                        ))}
                      </Form.Select>
                      <Form.Select 
                        value={timeRange} 
                        onChange={(e) => setTimeRange(e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="1month">Last Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="1year">Last Year</option>
                        <option value="all">All Time</option>
                      </Form.Select>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="pt-0">
                  {chartData ? (
                    <div style={{ height: '400px' }}>
                      <Line 
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            tooltip: {
                              mode: 'index',
                              intersect: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: false,
                            }
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <p>No data available for the selected parameter and time range.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          {/* Recent Reports */}
          <Row className="mb-4">
            <Col>
              <Card className="shadow">
                <Card.Header className="bg-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <FaFileMedical className="me-2 text-primary" />
                      <h5 className="mb-0">Recent Reports</h5>
                    </div>
                    <Button size="sm" onClick={goToUploadReport}>
                      Upload New Report
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  {recentReports.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Report Name</th>
                            <th>Date</th>
                            <th>Parameters Extracted</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentReports.map((report) => (
                            <tr key={report.id}>
                              <td>{report.report_name}</td>
                              <td>{format(new Date(report.uploaded_at), 'MMM dd, yyyy')}</td>
                              <td>
                                {report.extracted_parameters ? 
                                  Object.keys(report.extracted_parameters).length : 0} parameters
                              </td>
                              <td>
                                <Button 
                                  variant="link" 
                                  size="sm"
                                  onClick={() => window.open(report.file_url, '_blank')}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center">No reports uploaded yet.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default HealthAnalytics; 