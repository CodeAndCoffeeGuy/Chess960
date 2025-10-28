import { NextRequest, NextResponse } from 'next/server';
import { db } from '@chess960/db';
import { z } from 'zod';

const betaSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Beta signup request received');
    
    // Check database connection first
    try {
      await db.$connect();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { email } = betaSignupSchema.parse(body);
    console.log('Parsed email:', email);

        // Check if BetaEmail table exists by trying a simple query
        try {
          await db.$queryRaw`SELECT 1 FROM "BetaEmail" LIMIT 1`;
          console.log('BetaEmail table exists');
        } catch (tableError) {
          console.error('BetaEmail table check failed:', tableError);
          
          // Fallback: Create the table if it doesn't exist
          try {
            console.log('Attempting to create BetaEmail table...');
            await db.$executeRaw`
              CREATE TABLE IF NOT EXISTS "BetaEmail" (
                "id" TEXT NOT NULL,
                "email" TEXT NOT NULL,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "is_notified" BOOLEAN NOT NULL DEFAULT false,
                "notified_at" TIMESTAMP(3),
                CONSTRAINT "BetaEmail_pkey" PRIMARY KEY ("id")
              )
            `;
            
            await db.$executeRaw`
              CREATE UNIQUE INDEX IF NOT EXISTS "BetaEmail_email_key" ON "BetaEmail"("email")
            `;
            
            console.log('✅ BetaEmail table created successfully');
          } catch (createError) {
            console.error('Failed to create BetaEmail table:', createError);
            return NextResponse.json(
              { error: 'Database setup failed. Please try again later.' },
              { status: 500 }
            );
          }
        }

    // Check if email already exists
    const existingEmail = await db.betaEmail.findUnique({
      where: { email: email.toLowerCase() }
    });
    console.log('Existing email check:', existingEmail);

    if (existingEmail) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'You\'re already on our beta list! We\'ll notify you when we\'re ready.',
          alreadyExists: true 
        },
        { status: 200 }
      );
    }

    // Add email to beta list
    const newEmail = await db.betaEmail.create({
      data: {
        email: email.toLowerCase(),
      }
    });
    console.log('Created new beta email:', newEmail);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thanks! You\'ll be notified when Chess960 is ready for everyone.',
        alreadyExists: false 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Beta signup error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  } finally {
    // Ensure database connection is closed
    try {
      await db.$disconnect();
    } catch (disconnectError) {
      console.error('Database disconnect error:', disconnectError);
    }
  }
}
