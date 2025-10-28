import { NextRequest, NextResponse } from 'next/server';
import { db } from '@chess960/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Temporarily allow access without authentication for beta testing
    // TODO: Re-enable authentication after initial setup
    // if (process.env.NODE_ENV === 'production') {
    //   const authHeader = request.headers.get('authorization');
    //   if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //   }
    // }

    const { subject, htmlContent } = await request.json();

    // Get all beta emails that haven't been notified
    const betaEmails = await db.betaEmail.findMany({
      where: { isNotified: false },
      orderBy: { createdAt: 'asc' }
    });

    if (betaEmails.length === 0) {
      return NextResponse.json({ 
        message: 'No beta emails to notify',
        count: 0 
      });
    }

    // Send emails to all beta subscribers
    const emailPromises = betaEmails.map(async (betaEmail) => {
      try {
        await resend.emails.send({
          from: 'Chess960 <noreply@chess960.game>',
          to: betaEmail.email,
          subject: subject || '🎉 Chess960 is Ready! Start Playing Now',
          html: htmlContent || `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      padding: 40px;
      text-align: center;
      border-radius: 12px 12px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 0 0 12px 12px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: white;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .features {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .feature {
      margin: 10px 0;
      padding-left: 20px;
      position: relative;
    }
    .feature::before {
      content: "♟️";
      position: absolute;
      left: 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 28px;">Chess960 is Ready!</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">The wait is over - start playing Fischer Random Chess now!</p>
  </div>
  
  <div class="content">
    <h2>Welcome to Chess960! 🎉</h2>
    
    <p>Thanks for your patience! Chess960 is now live and ready for you to play. Experience the excitement of Fischer Random Chess with randomized starting positions that eliminate opening theory.</p>
    
    <div class="features">
      <h3 style="margin-top: 0;">What's Available:</h3>
      <div class="feature">Real-time multiplayer chess with WebSocket support</div>
      <div class="feature">Multiple time controls: Bullet, Blitz, Rapid, Classical</div>
      <div class="feature">Glicko-2 rating system for fair matchmaking</div>
      <div class="feature">Tournament system with team competitions</div>
      <div class="feature">Chess analysis with Stockfish integration</div>
      <div class="feature">Modern, responsive design for all devices</div>
    </div>
    
    <div style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL || 'https://chess960.game'}" class="cta-button">
        Start Playing Now →
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      Ready to experience chess like never before? No opening theory, just pure chess skill and creativity.
    </p>
  </div>
</body>
</html>
          `,
        });

        // Mark as notified
        await db.betaEmail.update({
          where: { id: betaEmail.id },
          data: { 
            isNotified: true,
            notifiedAt: new Date()
          }
        });

        return { success: true, email: betaEmail.email };
      } catch (error) {
        console.error(`Failed to send email to ${betaEmail.email}:`, error);
        return { 
          success: false, 
          email: betaEmail.email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      message: `Beta notification sent to ${successful} emails`,
      successful,
      failed,
      total: betaEmails.length,
      sentEmails: results.filter(r => r.success).map(r => r.email),
      results: failed > 0 ? results.filter(r => !r.success) : undefined
    });

  } catch (error) {
    console.error('Beta notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send beta notifications' },
      { status: 500 }
    );
  }
}
