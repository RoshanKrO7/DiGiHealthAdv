import React, { useState } from 'react';
import { setupSupabaseTables } from '../utils/setupSupabaseTablesExtended';
import { FaDatabase, FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const SetupDatabase = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  // Override console.log to capture logs
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  const setupDatabase = async () => {
    setLoading(true);
    setResult(null);
    setLogs([]);

    // Override console methods to capture logs
    console.log = (...args) => {
      setLogs(prev => [...prev, { type: 'info', message: args.join(' ') }]);
      originalConsoleLog(...args);
    };

    console.error = (...args) => {
      setLogs(prev => [...prev, { type: 'error', message: args.join(' ') }]);
      originalConsoleError(...args);
    };

    console.warn = (...args) => {
      setLogs(prev => [...prev, { type: 'warning', message: args.join(' ') }]);
      originalConsoleWarn(...args);
    };

    try {
      const setupResult = await setupSupabaseTables();
      setResult(setupResult);
    } catch (error) {
      setResult({
        success: false,
        message: `Unexpected error: ${error.message}`
      });
    } finally {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">
          <FaDatabase className="me-2" />
          Database Setup
        </h5>
        <p className="card-text">
          This utility will delete all existing tables and buckets in your Supabase project and recreate them with the proper structure.
          <strong className="text-danger"> Use with caution as this will delete all existing data!</strong>
        </p>

        {result && (
          <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'} mt-3`} role="alert">
            {result.success ? (
              <FaCheck className="me-2" />
            ) : (
              <FaExclamationTriangle className="me-2" />
            )}
            {result.message}
          </div>
        )}

        <div className="d-grid gap-2 mt-3">
          <button
            className="btn btn-danger"
            onClick={setupDatabase}
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="me-2 fa-spin" />
                Setting up database...
              </>
            ) : (
              <>
                <FaDatabase className="me-2" />
                Reset and Setup Database
              </>
            )}
          </button>
        </div>

        {logs.length > 0 && (
          <div className="mt-4">
            <h6>Setup Logs:</h6>
            <div className="border rounded p-3 bg-light" style={{ maxHeight: '300px', overflow: 'auto' }}>
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    log.type === 'error' 
                      ? 'text-danger' 
                      : log.type === 'warning' 
                        ? 'text-warning' 
                        : ''
                  }`}
                >
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupDatabase; 