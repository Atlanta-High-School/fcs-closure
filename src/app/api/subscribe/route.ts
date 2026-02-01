import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService, SubscriptionRequest } from '@/lib/subscription-service';
import { z } from 'zod';

// Security headers
const SECURITY_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

// Validation schema for subscription requests
const subscriptionSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  name: z.string().optional(),
  phone: z.string().optional(),
  preferences: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
  }).optional(),
});

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: SECURITY_HEADERS });
}

// Handle POST requests - new subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = subscriptionSchema.parse(body);
    
    // Create subscription
    const subscription = await subscriptionService.addSubscription(validatedData);
    
    // Send welcome email asynchronously
    subscriptionService.sendWelcomeEmail(subscription).catch(error => {
      console.error('Failed to send welcome email:', error);
    });
    
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to FCS weather alerts!',
      subscription: {
        id: subscription.id,
        email: subscription.email,
        name: subscription.name,
        preferences: subscription.preferences,
        createdAt: subscription.createdAt,
      }
    }, { 
      status: 201,
      headers: SECURITY_HEADERS 
    });
    
  } catch (error) {
    console.error('Subscription API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { 
        status: 400,
        headers: SECURITY_HEADERS 
      });
    }
    
    if (error instanceof Error && error.message.includes('already subscribed')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { 
        status: 409,
        headers: SECURITY_HEADERS 
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process subscription'
    }, { 
      status: 500,
      headers: SECURITY_HEADERS 
    });
  }
}

// Handle GET requests - get subscription info or stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const stats = searchParams.get('stats');
    
    if (stats === 'true') {
      const subscriptionStats = await subscriptionService.getStats();
      return NextResponse.json({
        success: true,
        stats: subscriptionStats
      }, { 
        headers: SECURITY_HEADERS 
      });
    }
    
    if (email) {
      const subscription = await subscriptionService.getSubscriptionByEmail(email);
      
      if (!subscription) {
        return NextResponse.json({
          success: false,
          error: 'Subscription not found'
        }, { 
          status: 404,
          headers: SECURITY_HEADERS 
        });
      }
      
      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          email: subscription.email,
          name: subscription.name,
          preferences: subscription.preferences,
          createdAt: subscription.createdAt,
        }
      }, { 
        headers: SECURITY_HEADERS 
      });
    }
    
    // Return all active subscriptions (admin use)
    const activeSubscriptions = await subscriptionService.getActiveSubscriptions();
    return NextResponse.json({
      success: true,
      subscriptions: activeSubscriptions.map(sub => ({
        id: sub.id,
        email: sub.email,
        name: sub.name,
        preferences: sub.preferences,
        createdAt: sub.createdAt,
      }))
    }, { 
      headers: SECURITY_HEADERS 
    });
    
  } catch (error) {
    console.error('GET subscription API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve subscription data'
    }, { 
      status: 500,
      headers: SECURITY_HEADERS 
    });
  }
}

// Handle DELETE requests - unsubscribe
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    
    if (!email && !id) {
      return NextResponse.json({
        success: false,
        error: 'Email or subscription ID is required for unsubscribe'
      }, { 
        status: 400,
        headers: SECURITY_HEADERS 
      });
    }
    
    let success = false;
    
    if (email) {
      success = await subscriptionService.unsubscribe(email);
    } else if (id) {
      success = await subscriptionService.unsubscribeById(id);
    }
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found or already unsubscribed'
      }, { 
        status: 404,
        headers: SECURITY_HEADERS 
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from FCS weather alerts'
    }, { 
      headers: SECURITY_HEADERS 
    });
    
  } catch (error) {
    console.error('Unsubscribe API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process unsubscribe request'
    }, { 
      status: 500,
      headers: SECURITY_HEADERS 
    });
  }
}

// Handle PUT requests - update preferences
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, preferences } = body;
    
    if (!email || !preferences) {
      return NextResponse.json({
        success: false,
        error: 'Email and preferences are required'
      }, { 
        status: 400,
        headers: SECURITY_HEADERS 
      });
    }
    
    const success = await subscriptionService.updatePreferences(email, preferences);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Subscription not found'
      }, { 
        status: 404,
        headers: SECURITY_HEADERS 
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully'
    }, { 
      headers: SECURITY_HEADERS 
    });
    
  } catch (error) {
    console.error('Update preferences API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update preferences'
    }, { 
      status: 500,
      headers: SECURITY_HEADERS 
    });
  }
}
