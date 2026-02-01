#!/usr/bin/env node

const { weatherMonitor } = require('../dist/weather-monitor');

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      const interval = parseInt(process.argv[3]) || 15;
      console.log(`Starting weather monitor with ${interval} minute intervals...`);
      weatherMonitor.startMonitoring(interval);
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\nStopping weather monitor...');
        weatherMonitor.stopMonitoring();
        process.exit(0);
      });
      
      // Prevent the script from exiting
      await new Promise(() => {});
      break;
      
    case 'check':
      console.log('Checking for updates now...');
      await weatherMonitor.checkNow();
      break;
      
    case 'status':
      const status = weatherMonitor.getStatus();
      console.log('Weather Monitor Status:');
      console.log(`- Running: ${status.isRunning}`);
      console.log(`- Last Hash: ${status.lastHash || 'None'}`);
      break;
      
    case 'stop':
      weatherMonitor.stopMonitoring();
      break;
      
    default:
      console.log('Weather Monitor CLI');
      console.log('');
      console.log('Usage:');
      console.log('  npm run weather-monitor start [interval]  - Start monitoring (default: 15 min intervals)');
      console.log('  npm run weather-monitor check              - Check for updates now');
      console.log('  npm run weather-monitor status             - Show current status');
      console.log('  npm run weather-monitor stop               - Stop monitoring');
      console.log('');
      console.log('Examples:');
      console.log('  npm run weather-monitor start 30          - Check every 30 minutes');
      console.log('  npm run weather-monitor check              - One-time check');
      break;
  }
}

main().catch(console.error);
