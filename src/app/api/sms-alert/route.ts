import { NextRequest, NextResponse } from 'next/server';
import { sendSMSNotification } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await sendSMSNotification(message);
    
    if (result) {
      return NextResponse.json(
        { success: true, message: 'SMS sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to send SMS' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
