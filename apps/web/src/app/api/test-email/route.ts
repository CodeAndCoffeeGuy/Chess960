import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'MISSING',
    SMTP_PORT: process.env.SMTP_PORT ? 'SET' : 'MISSING',
    SMTP_USER: process.env.SMTP_USER ? 'SET' : 'MISSING',
    SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'MISSING',
    EMAIL_FROM: process.env.EMAIL_FROM ? 'SET' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
  });
}
