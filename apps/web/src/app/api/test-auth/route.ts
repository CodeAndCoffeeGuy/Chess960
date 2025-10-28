import { NextResponse } from 'next/server';
import { getAuthService } from '@chess960/utils';

export async function GET() {
  try {
    console.log('Testing auth service...');
    console.log('Environment variables available:');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');
    console.log('MAGICLINK_SECRET:', process.env.MAGICLINK_SECRET ? 'SET' : 'MISSING');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Try to create auth service
    const authService = getAuthService();
    console.log('Auth service created successfully');

    // Test password hashing
    const hashedPassword = authService.hashPassword('testpassword');
    console.log('Password hashing works');

    // Test verification code generation
    const verificationCode = authService.generateEmailVerificationCode();
    console.log('Verification code generated:', verificationCode);

    return NextResponse.json({
      success: true,
      message: 'Auth service working',
      verificationCode,
      hasPasswordHashing: !!hashedPassword
    });

  } catch (error) {
    console.error('Auth service test error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown error type');
    console.error('Error message:', error instanceof Error ? error.message : String(error));

    return NextResponse.json({
      success: false,
      error: 'Auth service failed',
      debug: String(error)
    }, { status: 500 });
  }
}