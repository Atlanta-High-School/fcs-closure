'use client';

import { useState } from 'react';
import { Bell, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SignupForm {
  email: string;
  name: string;
  preferences: {
    email: boolean;
  };
}

interface SignupResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

export default function NotificationSignup() {
  const [formData, setFormData] = useState<SignupForm>({
    email: '',
    name: '',
    preferences: {
      email: true,
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<SignupResponse | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'emailNotifications') {
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          email: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: SignupResponse = await response.json();
      setResponse(data);

      if (data.success) {
        // Reset form on success
        setFormData({
          email: '',
          name: '',
          preferences: {
            email: true,
          }
        });
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

  const getFieldError = (fieldName: string) => {
    return response?.details?.find(detail => detail.field === fieldName)?.message;
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-full mr-3">
          <Bell className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Get Weather Alerts</h2>
          <p className="text-sm text-gray-600">Receive instant FCS status updates</p>
        </div>
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
            {response.details && (
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {response.details.map((detail, index) => (
                  <li key={index}>{detail.message}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name (Optional)
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                getFieldError('email') 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300'
              }`}
              placeholder="your@email.com"
            />
          </div>
          {getFieldError('email') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
          )}
        </div>

        {/* Email Notifications Preference */}
        <div className="bg-gray-50 p-4 rounded-md">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={formData.preferences.email}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Send me email notifications when FCS status changes
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !formData.email}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Subscribing...
            </>
          ) : (
            'Subscribe to Alerts'
          )}
        </button>
      </form>

      {/* Info Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Get instant alerts for Forsyth County Schools weather updates</p>
          <p>• Monitoring Monday, February 2nd for any changes</p>
          <p>• Unsubscribe at any time - no spam, ever</p>
        </div>
      </div>
    </div>
  );
}
