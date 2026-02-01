'use client';

import { useState, useEffect, useCallback } from 'react';
import { autoRefreshMonitor } from '@/lib/auto-refresh-monitor';
import { Play, Pause, RefreshCw, Settings, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface AutoRefreshManagerProps {
  onUpdate?: (status: string, timestamp: Date) => void;
  className?: string;
}

export default function AutoRefreshManager({ onUpdate, className = "" }: AutoRefreshManagerProps) {
  const [state, setState] = useState(autoRefreshMonitor.getState());
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState(autoRefreshMonitor.getConfig());

  // Update local state when monitor state changes
  const updateState = useCallback(() => {
    setState(autoRefreshMonitor.getState());
  }, []);

  // Update local config when monitor config changes
  const updateConfig = useCallback(() => {
    setConfig(autoRefreshMonitor.getConfig());
  }, []);

  useEffect(() => {
    // Set up event listeners
    autoRefreshMonitor.onUpdate((status, timestamp) => {
      updateState();
      if (onUpdate) {
        onUpdate(status, timestamp);
      }
    });

    autoRefreshMonitor.onError((error) => {
      updateState();
      console.error('Auto-refresh error:', error);
    });

    autoRefreshMonitor.onStatusChange((isMonitoring) => {
      updateState();
    });

    // Initial state sync
    updateState();
    updateConfig();

    // Cleanup
    return () => {
      autoRefreshMonitor.destroy();
    };
  }, [onUpdate, updateState, updateConfig]);

  const handleStart = () => {
    autoRefreshMonitor.start();
  };

  const handleStop = () => {
    autoRefreshMonitor.stop();
  };

  const handleForceCheck = () => {
    autoRefreshMonitor.forceCheck();
  };

  const handleConfigChange = (newConfig: Partial<typeof config>) => {
    autoRefreshMonitor.updateConfig(newConfig);
    updateConfig();
  };

  const formatInterval = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const getStatusIcon = () => {
    if (state.errorCount > 0) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else if (state.isMonitoring) {
      return <Activity className="w-4 h-4 text-green-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-gray-900">Auto-Refresh Monitor</h3>
              <p className="text-sm text-gray-600">
                {state.isMonitoring ? 'Monitoring for updates' : 'Monitoring stopped'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleForceCheck}
              disabled={!state.isMonitoring}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {state.isMonitoring ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Stop
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Details */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 block">Status</span>
            <span className={`font-medium ${state.isMonitoring ? 'text-green-600' : 'text-gray-500'}`}>
              {state.isMonitoring ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 block">Updates Found</span>
            <span className="font-medium">{state.updateCount}</span>
          </div>
          <div>
            <span className="text-gray-600 block">Last Check</span>
            <span className="font-medium text-sm">
              {state.lastCheck ? state.lastCheck.toLocaleTimeString() : 'Never'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 block">Errors</span>
            <span className={`font-medium ${state.errorCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
              {state.errorCount}
            </span>
          </div>
        </div>

        {state.lastUpdate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Last Update Detected</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {state.lastUpdate.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="font-medium mb-3">Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Interval
              </label>
              <select
                value={config.checkInterval}
                onChange={(e) => handleConfigChange({ checkInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
                <option value={600000}>10 minutes</option>
                <option value={900000}>15 minutes</option>
                <option value={1800000}>30 minutes</option>
                <option value={3600000}>1 hour</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Currently: {formatInterval(config.checkInterval)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Retries
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.maxRetries}
                onChange={(e) => handleConfigChange({ maxRetries: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retry Delay
              </label>
              <select
                value={config.retryDelay}
                onChange={(e) => handleConfigChange({ retryDelay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10000}>10 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
                <option value={300000}>5 minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
