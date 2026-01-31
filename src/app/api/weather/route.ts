import { NextRequest, NextResponse } from 'next/server';

// Security headers
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export async function GET(request: NextRequest) {
  console.log('🌤️ Weather API: Request received');
  
  try {
    // Use hardcoded key in production, fallback to env var for local dev
    const weatherApiKey = process.env.WEATHER_KEY || 'b15c56de27784749aac160754263101';
    console.log('🔑 Weather API: Using key (first 8 chars)', weatherApiKey?.substring(0, 8) + '...');
    
    if (!weatherApiKey) {
      console.error('❌ Weather API: WEATHER_KEY not configured');
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }

    console.log('🔑 Weather API: Key found, fetching from WeatherAPI.com');
    
    // Fetch weather data from WeatherAPI
    const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=30041&aqi=no`;
    console.log('🌐 Weather API: Request URL', apiUrl.replace(weatherApiKey, '[REDACTED]'));
    
    const weatherResponse = await fetch(apiUrl);

    console.log(`📡 Weather API: Response status ${weatherResponse.status}`);

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('❌ Weather API: Failed to fetch data', {
        status: weatherResponse.status,
        statusText: weatherResponse.statusText,
        bodyPreview: errorText.slice(0, 500),
      });
      return NextResponse.json(
        { error: 'Weather data unavailable', details: errorText.slice(0, 200) },
        { status: 502, headers: SECURITY_HEADERS }
      );
    }

    const weatherData = await weatherResponse.json();
    console.log('✅ Weather API: Data received', {
      location: weatherData.location?.name,
      temp_f: weatherData.current?.temp_f,
      condition: weatherData.current?.condition?.text,
      wind_mph: weatherData.current?.wind_mph,
      humidity: weatherData.current?.humidity,
    });
    
    return NextResponse.json(weatherData, {
      headers: {
        ...SECURITY_HEADERS,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('💥 Weather API: Unexpected error', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
