#!/usr/bin/env node

const https = require('https');
const { createHash } = require('crypto');

class SimpleWeatherMonitor {
  constructor() {
    this.url = 'https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure';
    this.lastHash = null;
  }

  async fetchPageContent() {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
        }
      };
      
      https.get(this.url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  extractCurrentStatus(html) {
    // Try multiple patterns to find the current status
    const patterns = [
      /## Current Status[\s\S]*?(?=##|$)/,
      /As of.*?2026[\s\S]*?(?=##|$)/,
      /Due to anticipated inclement weather[\s\S]*?(?=##|$)/,
      /All school activities[\s\S]*?(?=##|$)/
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let status = match[0]
          .replace(/## Current Status/, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (status.length > 20) { // Only return if we got meaningful content
          return status;
        }
      }
    }
    
    return 'Status section not found - page structure may have changed';
  }

  generateHash(content) {
    return createHash('md5').update(content).digest('hex');
  }

  async checkForUpdates() {
    try {
      console.log('🔍 Checking for weather updates...');
      const html = await this.fetchPageContent();
      const currentStatus = this.extractCurrentStatus(html);
      const currentHash = this.generateHash(currentStatus);

      if (this.lastHash && this.lastHash !== currentHash) {
        console.log('\n🚨 WEATHER UPDATE DETECTED! 🚨');
        console.log('='.repeat(60));
        console.log('NEW STATUS:');
        console.log(currentStatus);
        console.log('='.repeat(60));
        console.log(`Time: ${new Date().toLocaleString()}`);
        console.log(`Previous hash: ${this.lastHash}`);
        console.log(`New hash: ${currentHash}`);
      } else if (!this.lastHash) {
        console.log('📋 Initial status captured:');
        console.log(currentStatus);
        console.log(`Hash: ${currentHash}`);
      } else {
        console.log('✅ No updates detected.');
        console.log(`Current hash: ${currentHash}`);
      }

      this.lastHash = currentHash;
      return { updated: this.lastHash !== currentHash, status: currentStatus };
    } catch (error) {
      console.error('❌ Error checking for updates:', error.message);
      return { updated: false, error: error.message };
    }
  }
}

async function main() {
  const command = process.argv[2];
  const monitor = new SimpleWeatherMonitor();
  
  switch (command) {
    case 'check':
      await monitor.checkForUpdates();
      break;
      
    default:
      console.log('Simple Weather Monitor');
      console.log('');
      console.log('Usage:');
      console.log('  node scripts/weather-monitor-test.js check  - Check for updates now');
      console.log('');
      console.log('This version does not require API keys and is for testing only.');
      break;
  }
}

main().catch(console.error);
