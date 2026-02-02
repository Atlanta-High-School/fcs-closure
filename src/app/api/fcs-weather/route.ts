import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS, getClientIdentifier, checkRateLimit, validateRequest, createSecureResponse, createErrorResponse } from '@/lib/security';

const FCS_WEATHER_URL = 'https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure';

export async function GET(request: NextRequest) {
  try {
    console.log('🏫 FCS Weather API: Fetching status from Forsyth County Schools');
    
    // Validate request
    const validation = validateRequest(request);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }

    // Rate limiting
    const clientId = getClientIdentifier(request);
    if (!checkRateLimit(clientId, 'status')) {
      return createErrorResponse(
        'Rate limit exceeded. Please try again later.',
        429,
        { 'Retry-After': '60' }
      );
    }
    
    const response = await fetch(FCS_WEATHER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`❌ FCS Weather API: HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const status = extractCurrentStatus(html);
    
    console.log('✅ FCS Weather API: Status extracted successfully');
    
    return createSecureResponse({
      success: true,
      status,
      lastUpdated: new Date().toISOString(),
      source: FCS_WEATHER_URL
    });

  } catch (error) {
    console.error('💥 FCS Weather API: Error fetching weather status:', error);
    return createErrorResponse(
      'Failed to fetch Forsyth County Schools weather status',
      500,
      { message: error instanceof Error ? error.message : 'Unknown error' }
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
