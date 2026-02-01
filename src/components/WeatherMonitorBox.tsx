'use client';

import { useState, useEffect } from 'react';
import { Cloud, AlertTriangle, CheckCircle, Clock, RefreshCw, Bell, ExternalLink } from 'lucide-react';

interface WeatherStatus {
  status: string;
  lastUpdated: string;
  isMonitoring: boolean;
  lastCheck: string;
}

interface WeatherMonitorBoxProps {
  compact?: boolean;
  className?: string;
}

export default function WeatherMonitorBox({ compact = false, className = "" }: WeatherMonitorBoxProps) {
  const [weatherStatus, setWeatherStatus] = useState<WeatherStatus>({
    status: 'Loading...',
    lastUpdated: 'Never',
    isMonitoring: false,
    lastCheck: 'Never'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWeatherStatus = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/fcs-weather');
      const data = await response.json();
      
      if (data.success) {
        setWeatherStatus({
          status: data.status,
          lastUpdated: data.lastUpdated,
          isMonitoring: true,
          lastCheck: new Date().toLocaleString()
        });
      } else {
        throw new Error(data.message || 'Failed to fetch status');
      }
    } catch (error) {
      setWeatherStatus(prev => ({
        ...prev,
        status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastCheck: new Date().toLocaleString()
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherStatus();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchWeatherStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (weatherStatus.status.toLowerCase().includes('canceled') || 
        weatherStatus.status.toLowerCase().includes('closed')) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    } else if (weatherStatus.status.toLowerCase().includes('delayed')) {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    } else {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getStatusColor = () => {
    if (weatherStatus.status.toLowerCase().includes('canceled') || 
        weatherStatus.status.toLowerCase().includes('closed')) {
      return 'border-red-200 bg-red-50';
    } else if (weatherStatus.status.toLowerCase().includes('delayed')) {
      return 'border-yellow-200 bg-yellow-50';
    } else {
      return 'border-green-200 bg-green-50';
    }
  };

  if (compact) {
    return (
      <div className={`p-4 border-2 rounded-lg ${getStatusColor()} ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-sm">FCS Weather Status</h3>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {weatherStatus.status.slice(0, 100)}...
              </p>
            </div>
          </div>
          <button
            onClick={fetchWeatherStatus}
            disabled={isRefreshing}
            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 border-2 rounded-lg ${getStatusColor()} ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Cloud className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">Forsyth County Schools Weather Status</h2>
        </div>
        <div className="flex items-center gap-2">
          {weatherStatus.isMonitoring && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              <Bell className="w-3 h-3" />
              Monitoring
            </span>
          )}
          <button
            onClick={fetchWeatherStatus}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="mb-3">
            <h3 className="font-semibold mb-2">Current Status</h3>
            <p className="text-gray-700 leading-relaxed">{weatherStatus.status}</p>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last Updated: {new Date(weatherStatus.lastUpdated).toLocaleString()}
            </span>
            <a 
              href="https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Official Source
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
