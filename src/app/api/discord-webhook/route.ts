import { NextRequest, NextResponse } from 'next/server';
import { discordWebhook } from '@/lib/discord-webhook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, title, priority } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const success = await discordWebhook.sendAlert(
      message,
      title || 'FCS Alert',
      priority || 'medium'
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send Discord webhook' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Discord webhook API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const success = await discordWebhook.testWebhook();
    
    return NextResponse.json({ 
      success,
      message: success ? 'Test webhook sent successfully' : 'Test webhook failed'
    });
  } catch (error) {
    console.error('Discord test webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to send test webhook' },
      { status: 500 }
    );
  }
}
