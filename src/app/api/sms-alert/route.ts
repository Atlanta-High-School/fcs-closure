import { NextRequest, NextResponse } from 'next/server';
import { sendTwilioSMS } from '@/lib/twilio-sms-service';

// Security headers
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const result = await sendTwilioSMS(message);
    
    if (result) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'SMS sent successfully',
          timestamp: new Date().toISOString()
        },
        { headers: SECURITY_HEADERS }
      );
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send SMS',
          timestamp: new Date().toISOString()
        },
        { status: 500, headers: SECURITY_HEADERS }
      );
    }
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: SECURITY_HEADERS }
    );
  }
}
