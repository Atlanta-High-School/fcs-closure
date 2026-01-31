import { Vonage } from '@vonage/server-sdk';

const vonage = new Vonage({
  apiKey: "9ad70a72",
  apiSecret: "1PAeOMRKHWBfLPI7"
});

// For US numbers, Vonage requires a verified virtual number
// Using Vonage as sender ID (works for international, may need virtual number for US)
const from = "Vonage";
const to = "17708916033";

// Store the last known message to avoid duplicate texts
let lastKnownMessage: string | null = null;

export async function sendSMSNotification(message: string) {
  try {
    // Only send if the message is different from the last one
    if (message === lastKnownMessage) {
      console.log('Message unchanged, skipping SMS');
      return false;
    }

    const text = `FCS Alert: ${message}`;
    
    // Try to send SMS
    const response = await vonage.sms.send({ to, from, text });
    
    // Check if message was sent successfully
    if (response.messages[0].status === '0') {
      lastKnownMessage = message;
      console.log('✅ SMS sent successfully:', text);
      console.log('Message ID:', response.messages[0].messageId);
      return true;
    } else {
      console.log('❌ SMS failed:', response.messages[0].errorText);
      
      // Fallback: Log the message that would be sent
      console.log('📱 FALLBACK - Message that would be sent:');
      console.log(`To: ${to}`);
      console.log(`Message: ${text}`);
      console.log(`Timestamp: ${new Date().toLocaleString()}`);
      console.log('---');
      
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Fallback: Log the message that would be sent
    console.log('📱 FALLBACK - Message that would be sent:');
    console.log(`To: ${to}`);
    console.log(`Message: FCS Alert: ${message}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    console.log('---');
    
    return false;
  }
}

export function resetLastKnownMessage() {
  lastKnownMessage = null;
}
