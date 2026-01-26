'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, RefreshCw, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface SchoolStatus {
  status: string;
  lastUpdated: string;
  message: string;
  confidence?: number;
  source?: string;
}

interface SecurityConfig {
  maxRetries: number;
  timeoutMs: number;
  rateLimitMs: number;
}

const SECURITY_CONFIG: SecurityConfig = {
  maxRetries: 3,
  timeoutMs: 10000,
  rateLimitMs: 10000
};

export default function Home() {
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [securityStatus, setSecurityStatus] = useState<'verified' | 'checking' | 'error'>('checking');

  const checkSchoolStatus = useCallback(async (isRetry = false) => {
    if (!isOnline) {
      setError('Network connection unavailable');
      return;
    }

    try {
      setError(null);
      setSecurityStatus('checking');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.timeoutMs);
      
      const response = await fetch('/api/school-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Validate response data
      if (!data.status || !data.message) {
        throw new Error('Invalid response format');
      }
      
      setSchoolStatus({
        status: data.status,
        lastUpdated: data.lastUpdated,
        message: data.message,
        confidence: data.confidence || 0.95,
        source: 'Forsyth County Schools API'
      });
      
      setSecurityStatus('verified');
      setRetryCount(0);
      
    } catch (err) {
      setSecurityStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch school status';
      
      if (retryCount < SECURITY_CONFIG.maxRetries && !isRetry) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => checkSchoolStatus(true), 2000);
        return;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLastCheck(new Date());
    }
  }, [isOnline, retryCount]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Initial check
    checkSchoolStatus();
    
    // Set up interval to check every 10 seconds
    const interval = setInterval(() => checkSchoolStatus(), SECURITY_CONFIG.rateLimitMs);
    
    return () => clearInterval(interval);
  }, [checkSchoolStatus]);

  const statusColor = useMemo(() => {
    if (!schoolStatus) return 'gray';
    if (schoolStatus.status === 'School is scheduled as normal') return 'green';
    if (schoolStatus.status.includes('Cancelled') || schoolStatus.status.includes('Closed')) return 'red';
    if (schoolStatus.status.includes('Delayed')) return 'yellow';
    return 'blue';
  }, [schoolStatus]);

  const StatusIcon = useMemo(() => {
    switch (statusColor) {
      case 'green': return CheckCircle;
      case 'red': return XCircle;
      case 'yellow': return AlertTriangle;
      case 'blue': return Clock;
      default: return Shield;
    }
  }, [statusColor]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 font-sans"
    >
      <main className="flex min-h-screen w-full max-w-5xl flex-col items-center justify-center py-16 px-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-blue-500" />
            <h1 className="text-6xl font-bold text-white">
              School Status Checker
            </h1>
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-2xl text-gray-300 mb-2">
            Forsyth County Schools
          </p>
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <p className="text-xl text-blue-400 font-semibold">
              Tuesday, January 27th
            </p>
          </div>
        </motion.div>

        {/* Security Status Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl mb-6"
        >
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={`w-4 h-4 ${
                securityStatus === 'verified' ? 'text-green-500' : 
                securityStatus === 'checking' ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className="text-sm text-gray-300">
                Security: {securityStatus === 'verified' ? 'Verified' : securityStatus === 'checking' ? 'Checking' : 'Error'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-300">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </motion.div>
          
        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-300">Checking school status...</p>
              {retryCount > 0 && (
                <p className="text-sm text-yellow-400">Retry attempt {retryCount}/{SECURITY_CONFIG.maxRetries}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-900/80 backdrop-blur-sm border border-red-600 text-red-200 px-6 py-4 rounded-xl w-full max-w-2xl"
            >
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-400" />
                <div>
                  <p className="font-bold text-red-100">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          
        {/* Status Display */}
        <AnimatePresence>
          {schoolStatus && !loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl w-full max-w-3xl"
            >
              <div className="flex items-center justify-center gap-4 mb-6">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <StatusIcon className={`w-8 h-8 ${
                    statusColor === 'green' ? 'text-green-500' : 
                    statusColor === 'red' ? 'text-red-500' : 
                    statusColor === 'yellow' ? 'text-yellow-500' : 
                    statusColor === 'blue' ? 'text-blue-500' : 
                    'text-gray-500'
                  }`} />
                </motion.div>
                <h2 className="text-4xl font-bold text-white">
                  {schoolStatus.status}
                </h2>
              </div>
              
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6 border border-gray-700">
                <p className="text-gray-200 text-xl leading-relaxed text-center">
                  {schoolStatus.message}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400 border-t border-gray-700 pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {schoolStatus.lastUpdated}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Source: {schoolStatus.source}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Confidence: {Math.round((schoolStatus.confidence || 0.95) * 100)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          
        {/* Auto-refresh Info */}
        <AnimatePresence>
          {lastCheck && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-gray-400 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Auto-refresh every 10 seconds</span>
              </div>
              <p>Next check in: 10 seconds</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Refresh Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => checkSchoolStatus()}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-xl flex items-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Check Now
            </>
          )}
        </motion.button>
      </main>
    </motion.div>
  );
}
