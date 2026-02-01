import { NextRequest, NextResponse } from 'next/server';

const WEATHER_URL = 'https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure';

export async function GET() {
  try {
    const response = await fetch(WEATHER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const status = extractCurrentStatus(html);
    
    return NextResponse.json({
      success: true,
      status,
      lastUpdated: new Date().toISOString(),
      source: WEATHER_URL
    });

  } catch (error) {
    console.error('Error fetching weather status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch weather status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function extractCurrentStatus(html: string): string {
  // Try multiple patterns to find the current status
  const patterns = [
    /## Current Status[\s\S]*?(?=##|$)/,
    /As of.*?2026[\s\S]*?(?=##|$)/,
    /Due to anticipated inclement weather[\s\S]*?(?=##|$)/,
    /All school activities[\s\S]*?(?=##|$)/
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      let status = match[0]
        .replace(/## Current Status/, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (status.length > 20) {
        return status;
      }
    }
  }
  
  return 'Status section not found - page structure may have changed';
}
