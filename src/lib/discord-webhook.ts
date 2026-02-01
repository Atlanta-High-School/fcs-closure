interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

interface DiscordEmbed {
  title: string;
  description: string;
  color?: number;
  timestamp?: string;
  footer?: {
    text: string;
  };
}

class DiscordWebhookService {
  private webhookUrl: string;
  private lastSentContent: string = '';

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async sendAlert(message: string, title: string = "FCS Weather Update", priority: 'low' | 'medium' | 'high' = 'medium'): Promise<boolean> {
    try {
      // Avoid duplicate messages
      if (this.lastSentContent === message) {
        console.log('Discord: Duplicate message detected, skipping');
        return true;
      }

      const colorMap = {
        low: 0x00ff00,    // Green
        medium: 0xffff00, // Yellow
        high: 0xff0000     // Red
      };

      const payload: DiscordWebhookPayload = {
        content: "<@1195782745582993428>", // Ping specific user
        username: "FCS Weather Monitor",
        embeds: [{
          title: title,
          description: message,
          color: colorMap[priority],
          timestamp: new Date().toISOString(),
          footer: {
            text: "Forsyth County Schools Weather Monitor"
          }
        }]
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        this.lastSentContent = message;
        console.log('✅ Discord webhook sent successfully');
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Discord webhook failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('💥 Discord webhook error:', error);
      return false;
    }
  }

  async sendWeatherUpdate(status: string, timestamp: string): Promise<boolean> {
    const message = `**Forsyth County Schools Weather Status Update**\n\n**Status:** ${status}\n**Updated:** ${timestamp}`;
    return this.sendAlert(message, "Weather Status Update", 'high');
  }

  async sendSchoolStatusChange(oldStatus: string, newStatus: string): Promise<boolean> {
    const message = `**School Status Change Detected**\n\n**Previous Status:** ${oldStatus}\n**New Status:** ${newStatus}\n**Time:** ${new Date().toLocaleString()}`;
    return this.sendAlert(message, "School Status Change", 'high');
  }

  async testWebhook(): Promise<boolean> {
    const message = `**Test Message**\n\nThis is a test of the FCS Weather Monitor Discord webhook system.\n**Time:** ${new Date().toLocaleString()}`;
    return this.sendAlert(message, "Webhook Test", 'low');
  }

  // Reset the duplicate checker
  resetDuplicateChecker(): void {
    this.lastSentContent = '';
  }
}

// Singleton instance
export const discordWebhook = new DiscordWebhookService(
  'https://discord.com/api/webhooks/1401324571533119559/0kEoSfO1SNG6t3PYvxgSssEJ6sn7AP12Jr5UUz_JaEyjoX9I3ssH3rwG1fh6hLLYnrIR'
);

export { DiscordWebhookService };
