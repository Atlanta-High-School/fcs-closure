import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('https://www.forsyth.k12.ga.us/fs/pages/0/page-pops', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const lowerData = data.toLowerCase();
    
    // Look for "School" specifically and various status indicators
    const hasSchoolKeyword = lowerData.includes('school');
    
    let status = 'School is scheduled as normal';
    let message = 'No changes detected for Tuesday, January 27th';
    
    if (hasSchoolKeyword) {
      // Extract the Tuesday-specific section
      const tuesdaySection = data.match(/tuesday, january 27[^:]*:([^<]*)/i);
      const tuesdayText = tuesdaySection ? tuesdaySection[1].toLowerCase() : '';
      
      // Check for cancellations specifically in Tuesday section
      if (tuesdayText.includes('cancelled') || tuesdayText.includes('cancel') || tuesdayText.includes('closed')) {
        status = 'School Cancelled';
        message = 'Tuesday, January 27th will be cancelled';
      }
      // Check for delays specifically in Tuesday section
      else if (tuesdayText.includes('delayed') || tuesdayText.includes('delay')) {
        status = 'School Delayed';
        message = 'School will have a delayed opening on Tuesday, January 27th';
      }
      // Check for early dismissal specifically in Tuesday section
      else if (tuesdayText.includes('early dismissal') || tuesdayText.includes('dismissed early')) {
        status = 'Early Dismissal';
        message = 'School will have early dismissal on Tuesday, January 27th';
      }
      // Look for decision-making language about Tuesday
      else if (tuesdayText.includes('decision') || tuesdayText.includes('share a decision') || tuesdayText.includes('will share')) {
        status = 'Decision Pending';
        message = 'Decision about Tuesday, January 27th will be made by 5:00 PM Monday';
      }
      // If Tuesday is mentioned but no specific status
      else if (lowerData.includes('tuesday, january 27') || lowerData.includes('tuesday')) {
        status = 'School Status Update';
        message = 'Update available for Tuesday, January 27th - monitoring weather conditions';
      }
    }
    
    // Try to extract a more specific status if possible
    if (hasSchoolKeyword) {
      // Look for patterns like "School will be" or "School is" specifically about Tuesday
      const tuesdaySchoolMatch = data.match(/tuesday[^:]*:.*?school\s+(will\s+be|is)\s+([^.]+)/i);
      if (tuesdaySchoolMatch) {
        const extractedStatus = tuesdaySchoolMatch[2].trim();
        if (extractedStatus.length > 0 && extractedStatus.length < 100) {
          message = `Tuesday, January 27th: ${extractedStatus}`;
        }
      }
    }
    
    const result = {
      status,
      message,
      lastUpdated: new Date().toLocaleString(),
      rawData: data.substring(0, 500) // First 500 chars for debugging
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching school status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school status' },
      { status: 500 }
    );
  }
}
