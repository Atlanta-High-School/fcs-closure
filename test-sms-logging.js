// Test the SMS logging system that would be used in the actual app

const to = "17708916033";

// Simulate different school status messages
const testMessages = [
  "No changes detected for Monday, February 2nd", // Should not trigger SMS
  "School will be delayed 2 hours on Monday, February 2nd due to weather", // Should trigger SMS
  "School will be delayed 2 hours on Monday, February 2nd due to weather", // Duplicate - should not trigger
  "School is cancelled for Monday, February 2nd", // Should trigger SMS
];

let lastKnownMessage = null;

function simulateSMSNotification(message) {
  console.log(`\n🔍 Checking message: "${message}"`);
  
  // Only send if the message is different from the last one
  if (message === lastKnownMessage) {
    console.log('⏭️  Message unchanged, skipping SMS');
    return;
  }

  // Skip the default "no changes" message
  if (message === 'No changes detected for Monday, February 2nd') {
    console.log('⏭️  Default message, skipping SMS');
    return;
  }

  const text = `FCS Alert: ${message}`;
  
  // Log the message that would be sent
  console.log('📱 SMS WOULD BE SENT:');
  console.log(`   To: ${to}`);
  console.log(`   Message: ${text}`);
  console.log(`   Timestamp: ${new Date().toLocaleString()}`);
  console.log('   ---');
  
  lastKnownMessage = message;
}

console.log('🚀 Testing SMS Notification System');
console.log('=====================================');

testMessages.forEach(simulateSMSNotification);

console.log('\n✅ Test complete!');
console.log('💡 Note: Actual SMS requires Vonage virtual number for US delivery');
console.log('📱 The system will log messages and send SMS when virtual number is configured');
