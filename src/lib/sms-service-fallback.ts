// Fallback SMS service that logs messages instead of sending them
// This is because Vonage requires a verified virtual number for US SMS

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
    
    // Log the message that would be sent
    console.log('📱 SMS WOULD BE SENT:');
    console.log(`To: ${to}`);
    console.log(`Message: ${text}`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    console.log('---');
    
    lastKnownMessage = message;
    
    // Return true to indicate the "SMS was processed"
    return true;
  } catch (error) {
    console.error('Error processing SMS notification:', error);
    return false;
  }
}

export function resetLastKnownMessage() {
  lastKnownMessage = null;
}

// For testing: Function to manually check what messages would be sent
export function testSMSMessage(message: string) {
  console.log('🧪 TEST SMS Message:');
  console.log(`To: ${to}`);
  console.log(`Message: FCS Alert: ${message}`);
  console.log(`Timestamp: ${new Date().toLocaleString()}`);
  console.log('---');
}
