"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherMonitor = exports.weatherMonitor = void 0;
const crypto_1 = require("crypto");
const weather_notifications_1 = require("./weather-notifications");
class WeatherMonitor {
    constructor() {
        this.url = 'https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure';
        this.lastHash = null;
        this.checkInterval = null;
        this.isRunning = false;
        // Load last known hash from storage if available
        this.loadLastHash();
    }
    async fetchPageContent() {
        try {
            const response = await fetch(this.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Cache-Control': 'no-cache',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        }
        catch (error) {
            console.error('Error fetching weather page:', error);
            throw error;
        }
    }
    extractCurrentStatus(html) {
        // Look for the "Current Status" section
        const statusMatch = html.match(/## Current Status[\s\S]*?(?=##|$)/);
        if (statusMatch) {
            // Clean up the content and extract meaningful text
            let status = statusMatch[0]
                .replace(/## Current Status/, '')
                .replace(/<[^>]*>/g, '') // Remove HTML tags
                .replace(/\n+/g, ' ') // Replace multiple newlines with space
                .trim();
            return status;
        }
        // Fallback: look for any status-related content
        const fallbackMatch = html.match(/As of.*?(?=##|$)/);
        return fallbackMatch ? fallbackMatch[0].trim() : 'Status not found';
    }
    generateHash(content) {
        return (0, crypto_1.createHash)('md5').update(content).digest('hex');
    }
    loadLastHash() {
        // In a real implementation, you'd load this from a database or file
        // For now, we'll keep it in memory
        this.lastHash = null;
    }
    saveHash(hash) {
        // In a real implementation, you'd save this to a database or file
        this.lastHash = hash;
        console.log(`Saved new hash: ${hash}`);
    }
    async checkForUpdates() {
        try {
            console.log('Checking for weather updates...');
            const html = await this.fetchPageContent();
            const currentStatus = this.extractCurrentStatus(html);
            const currentHash = this.generateHash(currentStatus);
            if (this.lastHash && this.lastHash !== currentHash) {
                console.log('\n🚨 WEATHER UPDATE DETECTED! 🚨');
                console.log('='.repeat(50));
                console.log('New Status:');
                console.log(currentStatus);
                console.log('='.repeat(50));
                console.log(`Previous hash: ${this.lastHash}`);
                console.log(`New hash: ${currentHash}`);
                // Here you could send notifications, emails, etc.
                await this.sendNotification(currentStatus);
            }
            else if (!this.lastHash) {
                console.log('Initial status captured:');
                console.log(currentStatus);
            }
            else {
                console.log('No updates detected.');
            }
            this.saveHash(currentHash);
        }
        catch (error) {
            console.error('Error checking for updates:', error);
        }
    }
    async sendNotification(status) {
        try {
            const notificationData = {
                status,
                timestamp: new Date(),
            };
            await weather_notifications_1.weatherNotifications.sendWeatherUpdate(notificationData);
            console.log('✅ Weather notification sent successfully');
        }
        catch (error) {
            console.error('❌ Failed to send weather notification:', error);
        }
    }
    startMonitoring(intervalMinutes = 15) {
        if (this.isRunning) {
            console.log('Weather monitoring is already running');
            return;
        }
        console.log(`Starting weather monitoring (checking every ${intervalMinutes} minutes)...`);
        this.isRunning = true;
        // Initial check
        this.checkForUpdates();
        // Set up recurring checks
        this.checkInterval = setInterval(() => {
            this.checkForUpdates();
        }, intervalMinutes * 60 * 1000);
    }
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isRunning = false;
        console.log('Weather monitoring stopped');
    }
    async checkNow() {
        await this.checkForUpdates();
    }
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastHash: this.lastHash,
        };
    }
}
exports.WeatherMonitor = WeatherMonitor;
// Export singleton instance
exports.weatherMonitor = new WeatherMonitor();
