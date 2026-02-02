import { put } from '@vercel/blob';
import { NextResponse, NextRequest } from 'next/server';
import { SECURITY_HEADERS, getClientIdentifier, checkRateLimit, validateRequest, createSecureResponse, createErrorResponse } from '@/lib/security';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate request
    const validation = validateRequest(request);
    if (!validation.valid) {
      return createErrorResponse(validation.error!, 400);
    }

    // Rate limiting (very strict for uploads)
    const clientId = getClientIdentifier(request);
    if (!checkRateLimit(clientId, 'upload')) {
      return createErrorResponse(
        'Upload rate limit exceeded. Please try again later.',
        429,
        { 'Retry-After': '300' } // 5 minutes
      );
    }

    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
      return createErrorResponse('File too large. Maximum size is 10MB.', 413);
    }
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const fileType = searchParams.get('type') || 'general';

    if (!filename) {
      return createErrorResponse('Filename is required', 400);
    }

    // Validate filename
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return createErrorResponse('Invalid filename', 400);
    }

    // Add timestamp to filename to avoid conflicts
    const timestamp = Date.now();
    const uniqueFilename = `${fileType}-${timestamp}-${filename}`;

    // Store the file
    const blob = await put(uniqueFilename, request.body || '', {
      access: 'public',
    });

    // Return the blob information
    return createSecureResponse({
      success: true,
      url: blob.url,
      filename: uniqueFilename,
      uploadedAt: new Date().toISOString(),
      type: fileType
    });

  } catch (error) {
    console.error('Upload error:', error);
    return createErrorResponse(
      'Failed to upload file',
      500,
      { message: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}
