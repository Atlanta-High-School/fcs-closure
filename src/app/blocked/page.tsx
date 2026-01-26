'use client';

import { motion } from 'framer-motion';
import { Shield, MapPin, Lock } from 'lucide-react';

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-red-900 flex items-center justify-center">
      <div className="min-h-screen backdrop-blur-sm bg-black/20 w-full flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto px-6 text-center"
        >
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
            className="mb-8"
          >
            <Lock className="w-24 h-24 text-red-400 mx-auto" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-white mb-6"
          >
            Access Restricted
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl p-8 mb-8"
          >
            <MapPin className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-xl text-red-100 mb-4">
              This website is only available to users located in:
            </p>
            <div className="text-2xl font-bold text-white">
              United States of America<br />
              State of Georgia
            </div>
          </motion.div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-300 text-lg"
          >
            If you believe this is an error, please contact your system administrator.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex items-center justify-center gap-2 text-gray-400"
          >
            <Shield className="w-5 h-5" />
            <span className="text-sm">Security verification active</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
