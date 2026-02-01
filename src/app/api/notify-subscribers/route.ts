import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscription-service';
import { sendOneSignalEmail } from '@/lib/onesignal-service';

// Security headers
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

interface NotificationRequest {
  message: string;
  subject?: string;
  weatherData?: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high';
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: SECURITY_HEADERS });
}

// Handle POST requests - send notifications to all subscribers
export async function POST(request: NextRequest) {
  try {
    const body: NotificationRequest = await request.json();
    
    if (!body.message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { 
        status: 400,
        headers: SECURITY_HEADERS 
      });
    }

    // Get all active email subscribers
    const emailSubscribers = await subscriptionService.getEmailSubscribers();
    
    if (emailSubscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscribers to notify',
        notifiedCount: 0
      }, { 
        headers: SECURITY_HEADERS 
      });
    }

    // Prepare email content
    const emailHtml = generateNotificationEmail(body.message, body.weatherData);
    const subject = body.subject || '🚨 FCS Weather Status Update';

    // Send emails in batches to avoid overwhelming the API
    const batchSize = 100; // OneSignal allows up to 20,000 per request, but we'll be conservative
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < emailSubscribers.length; i += batchSize) {
      const batch = emailSubscribers.slice(i, i + batchSize);
      
      try {
        const response = await sendOneSignalEmail({
          app_id: process.env.ONESIGNAL_APP_ID!,
          email_subject: subject,
          email_body: emailHtml,
          email_to: batch,
          email_from_name: 'FCS Status Monitor',
          email_from_address: 'alerts@fcs-status.com',
          include_unsubscribed: false,
        });

        if (response.id) {
          successCount += batch.length;
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Sent ${batch.length} notifications`);
        } else {
          failureCount += batch.length;
          const errorMsg = response.errors ? JSON.stringify(response.errors) : 'Unknown error';
          errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${errorMsg}`);
          console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, errorMsg);
        }
      } catch (error) {
        failureCount += batch.length;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${errorMsg}`);
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} error:`, error);
      }

      // Small delay between batches to be respectful to the API
      if (i + batchSize < emailSubscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: failureCount === 0,
      message: `Notification process completed. Success: ${successCount}, Failures: ${failureCount}`,
      notifiedCount: successCount,
      failureCount,
      totalSubscribers: emailSubscribers.length,
      errors: errors.length > 0 ? errors : undefined
    }, { 
      headers: SECURITY_HEADERS 
    });

  } catch (error) {
    console.error('Notify subscribers API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send notifications to subscribers'
    }, { 
      status: 500,
      headers: SECURITY_HEADERS 
    });
  }
}

// Handle GET requests - get subscriber statistics
export async function GET() {
  try {
    const stats = await subscriptionService.getStats();
    const emailSubscribers = await subscriptionService.getEmailSubscribers();
    
    return NextResponse.json({
      success: true,
      stats,
      emailSubscribers: emailSubscribers.length,
      previewEmails: emailSubscribers.slice(0, 3).map(email => 
        email.replace(/(.{2}).*(@.*)/, '$1***$2')
      )
    }, { 
      headers: SECURITY_HEADERS 
    });
    
  } catch (error) {
    console.error('Get subscriber stats API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get subscriber statistics'
    }, { 
      status: 500,
      headers: SECURITY_HEADERS 
    });
  }
}

function generateNotificationEmail(message: string, weatherData?: Record<string, unknown>): string {
  const weatherInfo = weatherData ? {
    temperature: typeof weatherData === 'object' && 'temp_f' in weatherData ? `${weatherData.temp_f}°F` : 'N/A',
    conditions: typeof weatherData === 'object' && 'condition' in weatherData && weatherData.condition && typeof weatherData.condition === 'object' && 'text' in weatherData.condition ? String(weatherData.condition.text) : 'N/A',
    windSpeed: typeof weatherData === 'object' && 'wind_mph' in weatherData ? `${weatherData.wind_mph} mph` : 'N/A',
    humidity: typeof weatherData === 'object' && 'humidity' in weatherData ? `${weatherData.humidity}%` : 'N/A',
  } : null;

  return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 24px; text-align: center;">🚨 FCS Weather Alert</h1>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #92400e;">Status Update</h2>
      <p style="margin: 0; font-size: 16px; color: #451a03;">${message}</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">📅 Timestamp</h3>
      <p style="margin: 0; color: #6b7280;">${new Date().toLocaleString()}</p>
    </div>
    
    ${weatherInfo ? `
    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #374151;">🌤️ Current Weather Conditions</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
          <strong>Temperature:</strong> ${weatherInfo.temperature}
        </div>
        <div>
          <strong>Conditions:</strong> ${weatherInfo.conditions}
        </div>
        <div>
          <strong>Wind:</strong> ${weatherInfo.windSpeed}
        </div>
        <div>
          <strong>Humidity:</strong> ${weatherInfo.humidity}
        </div>
      </div>
    </div>
    ` : ''}
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">This is an automated alert from the FCS Status Monitoring System</p>
      <p style="margin: 5px 0 0 0;">You're receiving this because you subscribed to Forsyth County Schools weather alerts</p>
      <p style="margin: 5px 0 0 0;">
        <a href="#" style="color: #3b82f6; text-decoration: underline;">Unsubscribe</a> | 
        <a href="https://schoolcancelled.today" style="color: #3b82f6; text-decoration: underline;">View Status Dashboard</a>
      </p>
    </div>
  </div>
</div>
  `;
}
