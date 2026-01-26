# School Status Checker

A Next.js application that automatically checks the school status for Forsyth County Schools, Georgia, specifically for Tuesday, January 27th. The app checks the school district's API endpoint every 2 minutes to detect any updates about school closures, delays, or cancellations.

## Features

- **Automatic Monitoring**: Checks school status every 2 minutes
- **Real-time Updates**: Displays current school status with last update time
- **Manual Refresh**: Button to check status immediately
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatically adapts to system theme
- **Error Handling**: Shows clear error messages if the API is unavailable

## How It Works

The application fetches data from the Forsyth County Schools API endpoint:
`https://www.forsyth.k12.ga.us/fs/pages/0/page-pops`

It parses the response to detect keywords like:
- "closed" - School is closed
- "delayed" - School has a delayed opening  
- "cancelled" - School is cancelled

If none of these keywords are found, it assumes school is scheduled as normal.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Deployment Steps:

1. **Push to GitHub**: 
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Environment Variables** (if needed):
   - The app uses a server-side API route to handle CORS, so no additional environment variables are required for basic functionality.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── school-status/
│   │       └── route.ts      # API route for fetching school status
│   ├── page.tsx              # Main application page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/               # Reusable components (if needed)
└── lib/                      # Utility functions (if needed)
```

## Customization

To adapt this for a different school district or date:

1. Update the API endpoint in `src/app/api/school-status/route.ts`
2. Modify the parsing logic to match your district's response format
3. Update the target date in `src/app/page.tsx`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
