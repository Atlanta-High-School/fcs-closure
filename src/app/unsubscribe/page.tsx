'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const router = useRouter();

  // Check for email in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, []);

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setResponse({
        success: false,
        error: 'Please enter your email address'
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const response = await fetch(`/api/subscribe?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      setResponse(data);

      if (data.success) {
        // Clear form after successful unsubscribe
        setEmail('');
      }
    } catch (error) {
      setResponse({
        success: false,
        error: 'Network error. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.webp" 
            alt="Forsyth County Schools Logo" 
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">
            FCS Weather Alerts
          </h1>
          <p className="text-gray-400">
            Manage your notification preferences
          </p>
        </div>

        {/* Unsubscribe Form */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-full mb-4">
              <Mail className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Unsubscribe from Alerts
            </h2>
            <p className="text-gray-400 text-sm">
              Enter your email address to stop receiving FCS weather notifications
            </p>
          </div>

          {/* Response Messages */}
          {response && (
            <div className={`mb-4 p-4 rounded-lg flex items-start ${
              response.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {response.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  response.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {response.success ? response.message : response.error}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleUnsubscribe} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unsubscribing...
                </>
              ) : (
                'Unsubscribe from Alerts'
              )}
            </button>
          </form>

          {/* Info Section */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-xs text-gray-400 space-y-2 text-center">
              <p>
                We're sorry to see you go! You can always re-subscribe later.
              </p>
              <p>
                Questions? Contact us at{' '}
                <a href="mailto:support@schoolcancelled.today" className="text-blue-400 hover:underline">
                  support@schoolcancelled.today
                </a>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Status Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
