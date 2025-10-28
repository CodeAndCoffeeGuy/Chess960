import { Resend } from 'resend';

export interface MagicLinkEmailData {
  to: string;
  magicLink: string;
  expiresInMinutes?: number;
}

export interface VerificationEmailData {
  to: string;
  verificationCode: string;
  expiresInHours?: number;
}

export class EmailService {
  private resend: Resend | null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'Chess960 <noreply@chess960.game>';

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn('RESEND_API_KEY not found, email service disabled');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendMagicLink(data: MagicLinkEmailData): Promise<boolean> {
    const { to, magicLink, expiresInMinutes = 15 } = data;

    // Development mode - log to console
    if (process.env.NODE_ENV === 'development' && !this.resend) {
      console.log('\nMAGIC LINK (Development Mode - No Resend API Key)');
      console.log('To:', to);
      console.log('Link:', magicLink);
      console.log('Expires in:', expiresInMinutes, 'minutes');
      console.log('Click this link to sign in!\n');
      return true;
    }

    if (!this.resend) {
      console.error('Resend not configured');
      return false;
    }

    const html = this.getMagicLinkTemplate(magicLink, expiresInMinutes);

    try {
      const { data: result, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Sign in to Chess960 ⚡',
        html,
        text: this.getMagicLinkTextVersion(magicLink, expiresInMinutes),
      });

      if (error) {
        console.error('Failed to send magic link email:', error);
        return false;
      }

      console.log('Magic link email sent:', result?.id);
      return true;
    } catch (error) {
      console.error('Failed to send magic link email:', error);
      return false;
    }
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    const { to, verificationCode, expiresInHours = 24 } = data;

    // Development mode - log to console
    if (process.env.NODE_ENV === 'development' && !this.resend) {
      console.log('\nEMAIL VERIFICATION (Development Mode - No Resend API Key)');
      console.log('To:', to);
      console.log('Code:', verificationCode);
      console.log('Expires in:', expiresInHours, 'hours');
      console.log('Use this code to verify your email!\n');
      return true;
    }

    if (!this.resend) {
      console.error('Resend not configured');
      return false;
    }

    const html = this.getVerificationTemplate(verificationCode, expiresInHours);

    try {
      const { data: result, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Verify your email - Chess960 ⚡',
        html,
        text: this.getVerificationTextVersion(verificationCode, expiresInHours),
      });

      if (error) {
        console.error('Failed to send verification email:', error);
        return false;
      }

      console.log('Verification email sent:', result?.id);
      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  private getMagicLinkTemplate(magicLink: string, expiresInMinutes: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in to Chess960</title>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
    .footer { background: #f9fafb; padding: 16px; text-align: center; color: #6b7280; border-radius: 0 0 8px 8px; font-size: 14px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 16px 0; color: #92400e; }
  </style>
</head>
<body style="background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">⚡ Chess960</h1>
    </div>

    <div class="content">
      <h2 style="color: #111827; margin-top: 0;">Sign in to your account</h2>

      <p style="color: #374151; line-height: 1.6;">
        Click the button below to sign in to Chess960. This link will expire in <strong>${expiresInMinutes} minutes</strong> for security.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${magicLink}" class="button">Sign In to Chess960</a>
      </div>

      <div class="warning">
        <strong>Security Note:</strong> If you didn't request this login link, you can safely ignore this email.
        Someone may have accidentally entered your email address.
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        If the button above doesn't work, copy and paste this URL into your browser:<br>
        <code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; word-break: break-all;">${magicLink}</code>
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0;">
        Chess960 - Fischer Random Chess<br>
        <a href="https://chess960.game" style="color: #f97316;">Visit chess960.game</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private getMagicLinkTextVersion(magicLink: string, expiresInMinutes: number): string {
    return `
Sign in to Chess960

Click this link to sign in to your Chess960 account:
${magicLink}

This link will expire in ${expiresInMinutes} minutes for security.

If you didn't request this login link, you can safely ignore this email.

---
Chess960 - Fischer Random Chess
Visit: https://chess960.game
`;
  }

  private getVerificationTemplate(verificationCode: string, expiresInHours: number): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify your email - Chess960</title>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; }
    .code { background: #f3f4f6; border: 2px solid #f97316; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; color: #f97316; letter-spacing: 4px; border-radius: 8px; margin: 24px 0; }
    .footer { background: #f9fafb; padding: 16px; text-align: center; color: #6b7280; border-radius: 0 0 8px 8px; font-size: 14px; }
    .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 16px 0; color: #92400e; }
  </style>
</head>
<body style="background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">⚡ Chess960</h1>
    </div>

    <div class="content">
      <h2 style="color: #111827; margin-top: 0;">Verify your email address</h2>

      <p style="color: #374151; line-height: 1.6;">
        Welcome to Chess960! Please enter the verification code below to complete your registration:
      </p>

      <div class="code">${verificationCode}</div>

      <p style="color: #374151; line-height: 1.6;">
        This code will expire in <strong>${expiresInHours} hours</strong> for security.
      </p>

      <div class="warning">
        <strong>Security Note:</strong> If you didn't create an account with Chess960, you can safely ignore this email.
        Someone may have accidentally entered your email address.
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">
        Chess960 - Fischer Random Chess<br>
        <a href="https://chess960.game" style="color: #f97316;">Visit chess960.game</a>
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private getVerificationTextVersion(verificationCode: string, expiresInHours: number): string {
    return `
Verify your email - Chess960

Welcome to Chess960! Please use this verification code to complete your registration:

${verificationCode}

This code will expire in ${expiresInHours} hours for security.

If you didn't create an account with Chess960, you can safely ignore this email.

---
Chess960 - Fischer Random Chess
Visit: https://chess960.game
`;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.resend) {
      console.warn('Resend not configured');
      return false;
    }

    // Resend doesn't have a verify method, but we can check if the API key is set
    return true;
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
