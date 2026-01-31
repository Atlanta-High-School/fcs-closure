import { NextRequest, NextResponse } from 'next/server';
import { sendResendEmail } from '@/lib/resend-service';

// Security headers
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export async function POST(request: NextRequest) {
  try {
    const { message, weatherData } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const result = await sendResendEmail(message, weatherData);
    
    if (result) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email sent successfully',
          timestamp: new Date().toISOString()
        },
        { headers: SECURITY_HEADERS }
      );
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          timestamp: new Date().toISOString()
        },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
