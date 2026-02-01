# Forsyth County Schools Weather Monitor

A system to monitor the Forsyth County Schools inclement weather closure page and notify you when updates are detected.

## Current Status (as of last check)
**All school activities and athletics canceled** on Saturday, January 31 and Sunday, February 1, 2026. All district facilities and schools will be closed.

## Quick Start

### Test the System (No API Key Required)
```bash
node scripts/weather-monitor-test.js check
```

### Full System Setup (Requires API Key)
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Resend API key and recipient emails to `.env.local`:
   ```
   RESEND_API_KEY=your_resend_api_key_here
   WEATHER_MONITOR_RECIPIENTS=email1@example.com,email2@example.com
   ```

3. Compile TypeScript:
   ```bash
   npx tsc src/lib/weather-monitor.ts --outDir dist --target es2020 --module commonjs --moduleResolution node --esModuleInterop true --allowSyntheticDefaultImports true
   npx tsc src/lib/weather-notifications.ts --outDir dist --target es2020 --module commonjs --moduleResolution node --esModuleInterop true --allowSyntheticDefaultImports true
   ```

4. Run the monitor:
   ```bash
   npm run weather-monitor check
   ```

## Usage

### Commands
- `npm run weather-monitor check` - Check for updates once
- `npm run weather-monitor start [interval]` - Start monitoring (default: 15 minutes)
- `npm run weather-monitor status` - Show current monitor status
- `npm run weather-monitor stop` - Stop monitoring

### Examples
```bash
# Check once
npm run weather-monitor check

# Start monitoring every 30 minutes
npm run weather-monitor start 30

# Start monitoring every 15 minutes (default)
npm run weather-monitor start
```

## How It Works

1. **Monitoring**: The system fetches the Forsyth County Schools weather page at regular intervals
2. **Detection**: It extracts the "Current Status" section and creates a hash of the content
3. **Comparison**: If the hash changes from the previous check, an update is detected
4. **Notification**: An email is sent to all configured recipients with the new status

## Features

- ✅ **Real-time monitoring** of the official FCS weather page
- ✅ **Change detection** using content hashing
- ✅ **Email notifications** via Resend
- ✅ **Configurable check intervals**
- ✅ **CLI interface** for easy management
- ✅ **Test mode** without API requirements

## Monitored URL
https://www.forsyth.k12.ga.us/district-services/communications/inclement-weather-closure

## Notification Content

When an update is detected, you'll receive:
- 🚨 **Alert notification** with the new status
- 📅 **Timestamp** of when the change was detected
- 🔗 **Direct link** to the official FCS weather page
- 📧 **Formatted email** with professional styling

## File Structure

```
src/lib/
├── weather-monitor.ts      # Core monitoring logic
└── weather-notifications.ts # Email notification service

scripts/
├── weather-monitor-cli.js   # Full CLI (requires API key)
└── weather-monitor-test.js  # Test CLI (no API key needed)

dist/
├── weather-monitor.js       # Compiled monitor
└── weather-notifications.js # Compiled notifications
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Your Resend API key for sending emails | Yes (for notifications) |
| `WEATHER_MONITOR_RECIPIENTS` | Comma-separated list of email addresses | Yes (for notifications) |

## Production Deployment

For production use, consider:

1. **Process Manager**: Use PM2 or similar to keep the monitor running
2. **Logging**: Add structured logging for monitoring
3. **Database**: Store hash history and notification logs
4. **Rate Limiting**: Respect the website's rate limits
5. **Error Handling**: Implement robust error recovery

## Example PM2 Setup

```json
{
  "name": "weather-monitor",
  "script": "npm",
  "args": "run weather-monitor start 15",
  "instances": 1,
  "autorestart": true,
  "watch": false,
  "max_memory_restart": "1G",
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Troubleshooting

### "Status not found"
- The website structure may have changed
- Check if the monitored URL is still accessible
- Run the test version to debug the extraction

### Email not sending
- Verify your Resend API key is valid
- Check recipient email addresses
- Ensure your domain is verified in Resend

### Module not found errors
- Run the TypeScript compilation commands
- Check that the `dist/` directory exists and contains the compiled files

## License

This system is for monitoring public information from the Forsyth County Schools website. Please use responsibly and respect the website's terms of service.
