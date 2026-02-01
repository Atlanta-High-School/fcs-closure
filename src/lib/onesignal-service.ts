// OneSignal Email Service
// Replaces Resend functionality with OneSignal email API

// Store the last known message to avoid duplicate emails
let lastKnownEmailMessage: string | null = null;

// Email configuration
const FROM_EMAIL = 'forsyth@ahscampus.com';
const TO_EMAIL = process.env.NOTIFICATION_EMAIL || 'jgwatson29@gmail.com';

// OneSignal configuration
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

interface OneSignalEmailRequest {
  app_id: string;
  email_subject: string;
  email_body: string;
  email_to?: string[];
  email_from_name?: string;
  email_from_address?: string;
  email_reply_to_address?: string;
  include_unsubscribed?: boolean;
  disable_email_click_tracking?: boolean;
}

interface OneSignalEmailResponse {
  id: string;
  external_id?: string;
  errors?: {
    invalid_email_tokens?: string[];
    invalid_aliases?: Record<string, string[]>;
    invalid_player_ids?: string[];
  };
}

export async function sendOneSignalEmail(request: OneSignalEmailRequest): Promise<OneSignalEmailResponse> {
  if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
    throw new Error('OneSignal API key or App ID not configured');
  }

  const response = await fetch('https://api.onesignal.com/notifications?c=email', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${ONESIGNAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OneSignal API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function sendOneSignalEmailMessage(message: string, weatherData?: Record<string, unknown>): Promise<boolean> {
  if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
    console.warn('OneSignal API key or App ID not configured; skipping email');
    return false;
  }

  try {
    // Only send if the message is different from the last one
    if (message === lastKnownEmailMessage) {
      console.log('Email message unchanged, skipping email');
      return false;
    }

    // Skip the default "no changes" message
    if (message === 'No changes detected for Monday, February 2nd') {
      console.log('Default message, skipping email');
      return false;
    }

    // Prepare weather information
    const weatherInfo = weatherData ? {
      temperature: typeof weatherData === 'object' && 'temp_f' in weatherData ? `${weatherData.temp_f}°F` : 'N/A',
      conditions: typeof weatherData === 'object' && 'condition' in weatherData && weatherData.condition && typeof weatherData.condition === 'object' && 'text' in weatherData.condition ? String(weatherData.condition.text) : 'N/A',
      windSpeed: typeof weatherData === 'object' && 'wind_mph' in weatherData ? `${weatherData.wind_mph} mph` : 'N/A',
      humidity: typeof weatherData === 'object' && 'humidity' in weatherData ? `${weatherData.humidity}%` : 'N/A',
    } : null;

    // Create HTML email content
    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 24px; text-align: center;">🚨 FCS Status Alert</h1>
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
      <h3 style="margin: 0 0 15px 0; color: #374151;">🌤️ Weather Conditions</h3>
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
      <p style="margin: 5px 0 0 0;">Monitoring Forsyth County Schools for Monday, February 2nd</p>
    </div>
  </div>
</div>
    `;

    // Send email using OneSignal
    const response = await sendOneSignalEmail({
      app_id: ONESIGNAL_APP_ID,
      email_subject: '🚨 FCS Status Alert',
      email_body: htmlContent,
      email_to: [TO_EMAIL],
      email_from_name: 'FCS Status Monitor',
      email_from_address: FROM_EMAIL,
      include_unsubscribed: false,
      disable_email_click_tracking: false,
    });

    if (response.id) {
      lastKnownEmailMessage = message;
      console.log('✅ Email sent successfully via OneSignal');
      console.log('Message ID:', response.id);
      console.log('To:', TO_EMAIL);
      return true;
    } else {
      console.error('❌ OneSignal returned empty message ID');
      if (response.errors) {
        console.error('Errors:', response.errors);
      }
      return false;
    }
  } catch (error) {
    console.error('Error sending email via OneSignal:', error);
    
    // Fallback: Log the email that would be sent
    console.log('📧 FALLBACK - Email that would be sent:');
    console.log(`To: ${TO_EMAIL}`);
    console.log(`From: ${FROM_EMAIL}`);
    console.log(`Subject: 🚨 FCS Status Alert`);
    console.log(`Message: ${message}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    if (weatherData && typeof weatherData === 'object' && 'temp_f' in weatherData && 'condition' in weatherData && weatherData.condition && typeof weatherData.condition === 'object' && 'text' in weatherData.condition) {
      console.log(`Weather: ${weatherData.temp_f}°F, ${String(weatherData.condition.text)}`);
    }
    console.log('---');
    
    return false;
  }
}

export function resetLastKnownEmailMessage() {
  lastKnownEmailMessage = null;
}

// Test function to verify OneSignal setup
export async function testOneSignalEmail(): Promise<boolean> {
  if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
    console.warn('OneSignal API key or App ID not configured; cannot test email');
    return false;
  }

  try {
    const testHtmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 24px; text-align: center;">✅ Test Email</h1>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #065f46;">Test Message</h2>
      <p style="margin: 0; font-size: 16px; color: #064e3b;">Test message from FCS Status Monitor - OneSignal email is working! 🎉</p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">📅 Timestamp</h3>
      <p style="margin: 0; color: #6b7280;">${new Date().toLocaleString()}</p>
    </div>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">This is a test email from the FCS Status Monitoring System</p>
    </div>
  </div>
</div>
    `;

    const response = await sendOneSignalEmail({
      app_id: ONESIGNAL_APP_ID,
      email_subject: '✅ FCS Status Test - OneSignal Integration',
      email_body: testHtmlContent,
      email_to: [TO_EMAIL],
      email_from_name: 'FCS Status Monitor',
      email_from_address: FROM_EMAIL,
    });

    if (response.id) {
      console.log('✅ Test email sent successfully');
      console.log('Message ID:', response.id);
      return true;
    } else {
      console.error('❌ Test email failed: No message ID returned');
      if (response.errors) {
        console.error('Errors:', response.errors);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return false;
  }
}
