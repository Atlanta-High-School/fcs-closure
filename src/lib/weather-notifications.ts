import { sendOneSignalEmail } from './onesignal-service';

export interface WeatherNotificationData {
  status: string;
  timestamp: Date;
  previousStatus?: string;
}

export class WeatherNotificationService {
  private recipients: string[] = [];

  constructor(recipients: string[] = []) {
    this.recipients = recipients;
  }

  addRecipient(email: string): void {
    if (!this.recipients.includes(email)) {
      this.recipients.push(email);
    }
  }

  removeRecipient(email: string): void {
    this.recipients = this.recipients.filter(r => r !== email);
  }

  async sendWeatherUpdate(data: WeatherNotificationData): Promise<void> {
    if (this.recipients.length === 0) {
      console.log('No recipients configured for weather notifications');
      return;
    }

    try {
      const emailContent = this.generateEmailContent(data);
      
      for (const recipient of this.recipients) {
        await sendOneSignalEmail({
          app_id: process.env.ONESIGNAL_APP_ID!,
          email_subject: `🚨 Forsyth County Schools Weather Update - ${data.timestamp.toLocaleString()}`,
          email_body: emailContent,
          email_to: [recipient],
          email_from_name: 'Forsyth Schools Weather Monitor',
          email_from_address: 'weather@forsythschools.org',
        });
        
        console.log(`Weather update sent to: ${recipient}`);
      }
    } catch (error) {
      console.error('Failed to send weather notification:', error);
      throw error;
    }
  }

  private generateEmailContent(data: WeatherNotificationData): string {
    const { status, timestamp, previousStatus } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Forsyth County Schools Weather Update</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #1e40af;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f8fafc;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .status-box {
            background: white;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .timestamp {
            color: #6b7280;
            font-size: 14px;
            margin-top: 10px;
          }
          .footer {
            background: #f1f5f9;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-radius: 0 0 8px 8px;
            border: 1px solid #e2e8f0;
            border-top: none;
          }
          .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 Forsyth County Schools Weather Update</h1>
        </div>
        
        <div class="content">
          <div class="warning">
            <strong>Important:</strong> This is an automated weather status update from Forsyth County Schools.
          </div>
          
          <div class="status-box">
            <h3>Current Status:</h3>
            <p>${status}</p>
          </div>
          
          ${previousStatus ? `
          <div class="status-box">
            <h3>Previous Status:</h3>
            <p>${previousStatus}</p>
          </div>
          ` : ''}
          
          <div class="timestamp">
            <strong>Detected:</strong> ${timestamp.toLocaleString()}
          </div>
          
          <p>
            <strong>Source:</strong> 
            <a href="https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure" target="_blank">
              Forsyth County Schools Official Website
            </a>
          </p>
        </div>
        
        <div class="footer">
          <p>This is an automated notification. Please verify information on the official Forsyth County Schools website.</p>
          <p>To unsubscribe from these notifications, please contact the system administrator.</p>
        </div>
      </body>
      </html>
    `;
  }

  async sendTestNotification(): Promise<void> {
    const testData: WeatherNotificationData = {
      status: "This is a test notification from the Forsyth County Schools Weather Monitor system.",
      timestamp: new Date(),
    };

    await this.sendWeatherUpdate(testData);
  }
}

// Export singleton instance
export const weatherNotifications = new WeatherNotificationService();
