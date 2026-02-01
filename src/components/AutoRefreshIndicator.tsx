'use client';

import { useState, useEffect } from 'react';
import { autoRefreshMonitor } from '@/lib/auto-refresh-monitor';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface AutoRefreshIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function AutoRefreshIndicator({ className = "", showDetails = false }: AutoRefreshIndicatorProps) {
  const [state, setState] = useState(autoRefreshMonitor.getState());

  useEffect(() => {
    const updateState = () => {
      setState(autoRefreshMonitor.getState());
    };

    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (state.errorCount > 0) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    } else if (state.isMonitoring) {
      return <Activity className="w-4 h-4 text-green-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (state.errorCount > 0) {
      return `Error (${state.errorCount})`;
    } else if (state.isMonitoring) {
      return `Active (${state.updateCount} updates)`;
    } else {
      return 'Inactive';
    }
  };

  const getStatusColor = () => {
    if (state.errorCount > 0) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (state.isMonitoring) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">Auto-Refresh Status</span>
        </div>
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-600 block">Last Check</span>
          <span className="font-medium">
            {state.lastCheck ? state.lastCheck.toLocaleTimeString() : 'Never'}
          </span>
        </div>
        <div>
          <span className="text-gray-600 block">Updates</span>
          <span className="font-medium">{state.updateCount}</span>
        </div>
      </div>
    </div>
  );
}
