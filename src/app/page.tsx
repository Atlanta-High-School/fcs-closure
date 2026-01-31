import { CheckCircle, Sun, Cloud, CloudRain, Wind, Droplets, Clock, MapPin } from 'lucide-react';
import RefreshButton from '@/components/refresh-button';
import { formatDate } from '@/lib/date-utils';
import { getWeatherIcon } from '@/lib/weather-utils';

// Weather data interface
interface WeatherData {
  temp_f: number;
  condition: { text: string; icon: string };
  wind_mph: number;
  humidity: number;
}

// School status interface
interface SchoolStatus {
  status: string;
  lastUpdated: string;
  message: string;
}

function getBaseUrl(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
}

// Fetch weather data
async function fetchWeatherData(): Promise<WeatherData | null> {
  try {
    const baseUrl = getBaseUrl();
    
    const weatherUrl = baseUrl ? `${baseUrl}/api/weather` : '/api/weather';
    const response = await fetch(weatherUrl, {
      next: { revalidate: 600 } // Cache for 10 minutes
    });
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const bodyPreview = (await response.text()).slice(0, 200);
      throw new Error(`Weather API returned non-JSON response (${response.status}): ${bodyPreview}`);
    }

    const data = await response.json();
    return data.current || null;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

// Fetch school status
async function fetchSchoolStatus(): Promise<SchoolStatus | null> {
  try {
    const baseUrl = getBaseUrl();
    
    const statusUrl = baseUrl ? `${baseUrl}/api/status` : '/api/status';
    const response = await fetch(statusUrl);
    
    if (!response.ok) {
      throw new Error('School status API request failed');
    }
    
    return await response.json();
  } catch {
    // Silently handle school status errors to prevent page crashes
    return null;
  }
}

export default async function Home() {
  // Fetch data server-side
  const weatherData = await fetchWeatherData();
  const schoolStatus = await fetchSchoolStatus();
  
  const currentDate = formatDate();
  const weatherIconName = weatherData ? weatherData.condition?.text || '' : '';
  const WeatherIcon = weatherIconName ? getWeatherIcon(weatherIconName) : Sun;
  
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Deep charcoal background with subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-black" />
      
      {/* Digital grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-10" />
      
      {/* Vibrant neon accent overlays */}
      <div className="fixed inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="text-center py-8 px-4">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.webp" 
              alt="Forsyth County Schools Logo" 
              className="w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28"
            />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 tracking-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              FORSYTH COUNTY
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              SCHOOLS
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-5 font-light tracking-wide uppercase">
            Real-time Status Monitoring Dashboard
          </p>
          <div className="flex items-center justify-center gap-3 text-cyan-400">
            <Clock className="w-5 h-5" />
            <span className="text-base md:text-lg font-light tracking-wider">{currentDate}</span>
            <MapPin className="w-5 h-5 ml-3" />
            <span className="text-base md:text-lg font-light tracking-wider">Forsyth County, GA</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
            {/* Status Card */}
            <div className="h-full">
              {/* Main Status Card - High-Fidelity Glassmorphism */}
              <div className="relative group h-full">
                {/* Glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:from-green-500/30 group-hover:via-cyan-500/30 group-hover:to-blue-500/30 transition-all duration-500" />
                
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-7 md:p-9 shadow-2xl hover:bg-black/50 transition-all duration-500 h-full">
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-cyan-500/5 rounded-3xl" />
                  
                  <div className="relative h-full flex flex-col items-center justify-center text-center">
                    {/* Glowing checkmark */}
                    <div className="mb-6 relative">
                      <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
                      <CheckCircle className="relative w-20 h-20 md:w-28 md:h-28 text-green-400 drop-shadow-[0_0_40px_rgba(52,211,153,0.8)]" />
                    </div>
                    
                    {/* Bold status text */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-5 tracking-tight">
                      <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        SCHOOL IS ON SCHEDULE
                      </span>
                    </h2>
                    
                    <p className="text-lg md:text-xl text-gray-300 mb-7 font-light tracking-wide">
                      {schoolStatus?.message || 'All operations proceeding normally'}
                    </p>
                    
                    {/* Enhanced refresh button */}
                    <RefreshButton />
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Card */}
            <div className="h-full">
              {/* Weather Card - High-Fidelity Design */}
              <div className="relative group h-full">
                {/* Glowing border */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:from-cyan-500/30 group-hover:via-blue-500/30 group-hover:to-purple-500/30 transition-all duration-500" />
                
                <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl hover:bg-black/50 transition-all duration-500 h-full">
                  {/* Inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 rounded-3xl" />
                  
                  <div className="relative h-full flex flex-col">
                    <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-3 tracking-wide">
                      <WeatherIcon className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" />
                      Weather Conditions
                    </h3>
                    
                    {weatherData ? (
                      <div className="space-y-5 flex-1 flex flex-col justify-center">
                        {/* Weather icon and temperature */}
                        <div className="text-center">
                          <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-2xl" />
                            <WeatherIcon className="relative w-16 h-16 md:w-20 md:h-20 text-cyan-400" />
                          </div>
                          <p className="text-3xl md:text-4xl font-black mb-2 tracking-tight">
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                              {weatherData.temp_f}°F
                            </span>
                          </p>
                          <p className="text-lg text-gray-300 font-light tracking-wide">
                            {weatherData.condition?.text || 'Unknown'}
                          </p>
                        </div>
                        
                        {/* Weather details */}
                        <div className="grid grid-cols-2 gap-5 pt-5 border-t border-white/10">
                          <div className="flex items-center gap-3">
                            <Wind className="w-5 h-5 text-cyan-400" />
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider">Wind</p>
                              <p className="text-base font-bold text-white">{weatherData.wind_mph} mph</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-cyan-400" />
                            <div>
                              <p className="text-xs text-gray-400 uppercase tracking-wider">Humidity</p>
                              <p className="text-base font-bold text-white">{weatherData.humidity}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 flex-1 flex items-center justify-center">
                        <Cloud className="w-14 h-14 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-400 text-base">Weather data unavailable</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
