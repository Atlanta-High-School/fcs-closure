'use client';

import { useState, useEffect } from 'react';

interface SchoolStatus {
  status: string;
  lastUpdated: string;
  message: string;
}

export default function Home() {
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkSchoolStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/school-status');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setSchoolStatus({
        status: data.status,
        lastUpdated: data.lastUpdated,
        message: data.message
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch school status');
    } finally {
      setLoading(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Initial check
    checkSchoolStatus();
    
    // Set up interval to check every 10 seconds (10,000 milliseconds)
    const interval = setInterval(checkSchoolStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 font-sans">
      <main className="flex min-h-screen w-full max-w-4xl flex-col items-center justify-center py-16 px-8 bg-gray-800">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2">
              School Status Checker
            </h1>
            <p className="text-xl text-gray-300">
              Forsyth County Schools
            </p>
            <p className="text-lg text-blue-400 font-semibold">
              Tuesday, January 27th
            </p>
          </div>
          
          {loading && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-300">Checking school status...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900 border border-red-600 text-red-200 px-6 py-4 rounded-lg">
              <p className="font-bold text-red-100">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          {schoolStatus && !loading && (
            <div className="bg-gray-700 border border-gray-600 rounded-xl p-8 shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`w-6 h-6 rounded-full ${
                  schoolStatus.status === 'School is scheduled as normal' 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
                } animate-pulse`}></div>
                <h2 className="text-3xl font-bold text-white">
                  {schoolStatus.status}
                </h2>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <p className="text-gray-200 text-lg leading-relaxed">
                  {schoolStatus.message}
                </p>
              </div>
              
              <div className="text-sm text-gray-400 border-t border-gray-600 pt-4">
                <p className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Last updated: {schoolStatus.lastUpdated}
                </p>
              </div>
            </div>
          )}
          
          {lastCheck && (
            <div className="text-sm text-gray-400 text-center">
              <p className="flex items-center justify-center gap-2 mb-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Auto-refresh every 10 seconds
              </p>
              <p>Next check in: 10 seconds</p>
            </div>
          )}
          
          <button
            onClick={checkSchoolStatus}
            disabled={loading}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 font-semibold text-lg shadow-lg"
          >
            {loading ? 'Checking...' : 'Check Now'}
          </button>
        </div>
      </main>
    </div>
  );
}
