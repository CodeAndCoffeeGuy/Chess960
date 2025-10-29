import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';
import { getEmailService } from '@chess960/utils/dist/email';
import { z } from 'zod';

const requestSchema = z.object({
  email: z.string().email().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestSchema.parse(body);

    const authService = getAuthService();
    const emailService = getEmailService();

    // Generate magic link
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const magicLink = authService.generateMagicLinkUrl(email, baseUrl);

    // Send magic link email
    const emailSent = await emailService.sendMagicLink({
      to: email,
      magicLink,
      expiresInMinutes: 15,
    });

    if (!emailSent) {
      console.error('Failed to send magic link email to:', email);
      // Don't reveal email sending failure to client for security
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a magic link has been sent.',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('Magic link request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}