const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: "9ad70a72",
  apiSecret: "1PAeOMRKHWBfLPI7"
});

const from = "Vonage";
const to = "17708916033"; // Your actual number
const text = 'Test message from FCS Status Monitor - SMS system is working! 🎉';

async function sendTestSMS() {
    try {
        await vonage.sms.send({to, from, text})
            .then(resp => { 
                console.log('✅ Message sent successfully'); 
                console.log('Response:', resp); 
                console.log('Message details:', resp.messages[0]);
            })
            .catch(err => { 
                console.log('❌ There was an error sending the message.'); 
                console.error('Error:', err); 
                if (err.response) {
                    console.log('Response details:', err.response);
                    if (err.response.messages && err.response.messages[0]) {
                        console.log('Message error details:', err.response.messages[0]);
                    }
                }
            });
    } catch (error) {
        console.error('❌ Failed to send SMS:', error);
    }
}

console.log('🚀 Sending test SMS...');
sendTestSMS();
