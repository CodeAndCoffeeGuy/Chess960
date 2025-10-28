import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Test minimal endpoint called');
    
    // Test basic environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasJWT_SECRET: !!process.env.JWT_SECRET,
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      VERCEL: process.env.VERCEL,
    };
    
    console.log('Environment check:', envCheck);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Minimal test endpoint is working',
      timestamp: new Date().toISOString(),
      env: envCheck
    });
  } catch (error) {
    console.error('Test minimal endpoint error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}