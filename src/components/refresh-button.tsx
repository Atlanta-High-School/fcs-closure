'use client';

import { RefreshCw } from 'lucide-react';

export default function RefreshButton() {
  return (
    <button 
      onClick={() => window.location.reload()}
      className="group relative px-5 py-2 bg-gradient-to-r from-green-500 via-cyan-500 to-blue-500 hover:from-green-400 hover:via-cyan-400 hover:to-blue-400 text-white font-black text-sm rounded-xl shadow-2xl hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] hover:scale-105 transition-all duration-500 flex items-center gap-2 tracking-wide uppercase"
    >
      {/* Button glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 rounded-xl blur-xl group-hover:from-green-500/40 group-hover:via-cyan-500/40 group-hover:to-blue-500/40 transition-all duration-500" />
      
      {/* Button content */}
      <div className="relative flex items-center gap-2">
        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        <span>Refresh Status</span>
      </div>
    </button>
  );
}
