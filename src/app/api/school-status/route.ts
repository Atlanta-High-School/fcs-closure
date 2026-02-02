import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS, getClientIdentifier, checkRateLimit, validateRequest, createSecureResponse, createErrorResponse } from '@/lib/security';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
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

    // Fetch with security headers and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch('https://www.forsyth.k12.ga.us/fs/pages/0/page-pops', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const lowerData = data.toLowerCase();
    
    // Security validation of response
    if (data.length > 1000000) { // 1MB limit
      throw new Error('Response too large');
    }
    
    // Look for "School" specifically and various status indicators
    const hasSchoolKeyword = lowerData.includes('school');
    
    let status = 'School is scheduled as normal';
    let message = 'No changes detected for Monday, February 2nd';
    let confidence = 0.95;
    
    if (hasSchoolKeyword) {
      // Extract the Monday-specific section
      const mondaySection = data.match(/monday, february 2[^:]*:([^<]*)/i);
      const mondayText = mondaySection ? mondaySection[1].toLowerCase() : '';
      
      // Check for cancellations specifically in Monday section
      if (mondayText.includes('cancelled') || mondayText.includes('cancel') || mondayText.includes('closed')) {
        status = 'School Cancelled';
        message = 'Monday, February 2nd will be cancelled';
        confidence = 0.98;
      }
      // Check for delays specifically in Monday section
      else if (mondayText.includes('delayed') || mondayText.includes('delay')) {
        status = 'School Delayed';
        message = 'School will have a delayed opening on Monday, February 2nd';
        confidence = 0.96;
      }
      // Check for early dismissal specifically in Monday section
      else if (mondayText.includes('early dismissal') || mondayText.includes('dismissed early')) {
        status = 'Early Dismissal';
        message = 'School will have early dismissal on Monday, February 2nd';
        confidence = 0.96;
      }
      // Look for decision-making language about Monday
      else if (mondayText.includes('decision') || mondayText.includes('share a decision') || mondayText.includes('will share')) {
        status = 'Decision Pending';
        message = 'Decision about Monday, February 2nd will be made by 5:00 PM Sunday';
        confidence = 0.92;
      }
      // If Monday is mentioned but no specific status
      else if (lowerData.includes('monday, february 2') || lowerData.includes('monday')) {
        status = 'School Status Update';
        message = 'Update available for Monday, February 2nd - monitoring weather conditions';
        confidence = 0.88;
      }
    }
    
    // Try to extract a more specific status if possible
    if (hasSchoolKeyword) {
      // Look for patterns like "School will be" or "School is" specifically about Monday
      const mondaySchoolMatch = data.match(/monday[^:]*:.*?school\s+(will\s+be|is)\s+([^.]+)/i);
      if (mondaySchoolMatch) {
        const extractedStatus = mondaySchoolMatch[2].trim();
        if (extractedStatus.length > 0 && extractedStatus.length < 100) {
          message = `Monday, February 2nd: ${extractedStatus}`;
          confidence = 0.94;
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    const result = {
      status,
      message,
      lastUpdated: new Date().toLocaleString(),
      confidence,
      source: 'Forsyth County Schools API',
      processingTime: `${processingTime}ms`,
      rawData: data.substring(0, 500) // First 500 chars for debugging
    };

    return createSecureResponse(result, 200, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
  } catch (error) {
    console.error('Error fetching school status:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch school status';
    const processingTime = Date.now() - startTime;
    
    return createErrorResponse(
      errorMessage,
      500,
      { processingTime: `${processingTime}ms` }
    );
  }
}
