import { NextResponse } from 'next/server';
import { discordWebhook } from '@/lib/discord-webhook';

export async function GET() {
  try {
    console.log('🧪 Testing Discord webhook...');
    
    const testMessage = `**Test Message from FCS Weather Monitor**\n\nThis is a test to verify the Discord webhook is working correctly.\n\n🕐 **Test Time:** ${new Date().toLocaleString()}\n🔧 **System Status:** Online\n📡 **Webhook URL:** Configured`;
    
    const success = await discordWebhook.sendAlert(
      testMessage,
      "🧪 Discord Webhook Test",
      'low'
    );

    if (success) {
      console.log('✅ Discord webhook test successful');
      return NextResponse.json({ 
        success: true,
        message: 'Discord webhook test sent successfully!',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Discord webhook test failed');
      return NextResponse.json({ 
        success: false,
        error: 'Discord webhook test failed',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('💥 Discord webhook test error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
