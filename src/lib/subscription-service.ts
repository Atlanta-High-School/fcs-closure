// Notification Subscription Service
// Manages user subscriptions for FCS weather alerts

export interface Subscription {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  active: boolean;
  createdAt: Date;
  unsubscribedAt?: Date;
  preferences: {
    email: boolean;
    sms?: boolean;
  };
}

export interface SubscriptionRequest {
  email: string;
  name?: string;
  phone?: string;
  preferences?: {
    email?: boolean;
    sms?: boolean;
  };
}

// In-memory storage (in production, use a database)
let subscriptions: Subscription[] = [];

export class SubscriptionService {
  // Generate a unique ID for subscriptions
  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add a new subscription
  async addSubscription(request: SubscriptionRequest): Promise<Subscription> {
    // Check if email already exists
    const existingSubscription = subscriptions.find(sub => 
      sub.email.toLowerCase() === request.email.toLowerCase() && sub.active
    );

    if (existingSubscription) {
      throw new Error('Email is already subscribed to notifications');
    }

    const subscription: Subscription = {
      id: this.generateId(),
      email: request.email.toLowerCase(),
      name: request.name?.trim(),
      phone: request.phone?.trim(),
      active: true,
      createdAt: new Date(),
      preferences: {
        email: request.preferences?.email ?? true,
        sms: request.preferences?.sms ?? false,
      }
    };

    subscriptions.push(subscription);
    console.log(`✅ New subscription added: ${subscription.email}`);
    
    return subscription;
  }

  // Get all active subscriptions
  async getActiveSubscriptions(): Promise<Subscription[]> {
    return subscriptions.filter(sub => sub.active);
  }

  // Get subscription by email
  async getSubscriptionByEmail(email: string): Promise<Subscription | null> {
    return subscriptions.find(sub => 
      sub.email.toLowerCase() === email.toLowerCase() && sub.active
    ) || null;
  }

  // Unsubscribe by email
  async unsubscribe(email: string): Promise<boolean> {
    const subscription = subscriptions.find(sub => 
      sub.email.toLowerCase() === email.toLowerCase() && sub.active
    );

    if (!subscription) {
      return false;
    }

    subscription.active = false;
    subscription.unsubscribedAt = new Date();
    
    console.log(`🔕 Unsubscribed: ${email}`);
    return true;
  }

  // Unsubscribe by ID
  async unsubscribeById(id: string): Promise<boolean> {
    const subscription = subscriptions.find(sub => sub.id === id && sub.active);

    if (!subscription) {
      return false;
    }

    subscription.active = false;
    subscription.unsubscribedAt = new Date();
    
    console.log(`🔕 Unsubscribed by ID: ${id} (${subscription.email})`);
    return true;
  }

  // Get email list for notifications
  async getEmailSubscribers(): Promise<string[]> {
    const activeSubscriptions = await this.getActiveSubscriptions();
    return activeSubscriptions
      .filter(sub => sub.preferences.email)
      .map(sub => sub.email);
  }

  // Update subscription preferences
  async updatePreferences(email: string, preferences: Partial<Subscription['preferences']>): Promise<boolean> {
    const subscription = subscriptions.find(sub => 
      sub.email.toLowerCase() === email.toLowerCase() && sub.active
    );

    if (!subscription) {
      return false;
    }

    subscription.preferences = {
      ...subscription.preferences,
      ...preferences
    };

    console.log(`📝 Updated preferences for: ${email}`);
    return true;
  }

  // Get subscription statistics
  async getStats(): Promise<{
    total: number;
    active: number;
    emailOnly: number;
    smsOnly: number;
    both: number;
  }> {
    const activeSubscriptions = subscriptions.filter(sub => sub.active);
    
    return {
      total: subscriptions.length,
      active: activeSubscriptions.length,
      emailOnly: activeSubscriptions.filter(sub => sub.preferences.email && !sub.preferences.sms).length,
      smsOnly: activeSubscriptions.filter(sub => !sub.preferences.email && sub.preferences.sms).length,
      both: activeSubscriptions.filter(sub => sub.preferences.email && sub.preferences.sms).length,
    };
  }

  // Send welcome email to new subscriber
  async sendWelcomeEmail(subscription: Subscription): Promise<void> {
    try {
      const { sendOneSignalEmail } = await import('./onesignal-service');
      
      const welcomeHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #0f172a; color: white; padding: 20px; border-radius: 10px 10px 0 0;">
    <h1 style="margin: 0; font-size: 24px; text-align: center;">🎉 Welcome to FCS Alerts</h1>
  </div>
  
  <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 10px 0; color: #065f46;">You're All Set!</h2>
      <p style="margin: 0; font-size: 16px; color: #064e3b;">
        ${subscription.name ? `Hi ${subscription.name},` : 'Hi there,'} you've successfully subscribed to Forsyth County Schools weather alerts.
      </p>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">📧 What to Expect</h3>
      <ul style="color: #6b7280; line-height: 1.6;">
        <li>Instant notifications when school status changes</li>
        <li>Weather-related closure announcements</li>
        <li>Updates for Monday, February 2nd monitoring</li>
      </ul>
    </div>
    
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #374151;">🔧 Your Preferences</h3>
      <p style="margin: 0; color: #6b7280;">
        Email notifications: <strong>${subscription.preferences.email ? 'Enabled' : 'Disabled'}</strong>
        ${subscription.preferences.sms ? `<br>SMS notifications: <strong>Enabled</strong>` : ''}
      </p>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>Need to update preferences or unsubscribe?</strong><br>
        You can manage your subscription at any time.
      </p>
    </div>
    
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
      <p style="margin: 0;">This is an automated message from the FCS Status Monitoring System</p>
      <p style="margin: 5px 0 0 0;">Subscription ID: ${subscription.id}</p>
    </div>
  </div>
</div>
      `;

      await sendOneSignalEmail({
        app_id: process.env.ONESIGNAL_APP_ID!,
        email_subject: '🎉 Welcome to FCS Weather Alerts',
        email_body: welcomeHtml,
        email_to: [subscription.email],
        email_from_name: 'FCS Status Monitor',
        email_from_address: 'alerts@fcs-status.com',
      });

      console.log(`✅ Welcome email sent to: ${subscription.email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
