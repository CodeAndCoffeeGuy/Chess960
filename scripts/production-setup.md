# Production Setup Guide

This guide walks you through setting up Bullet Chess in production using Vercel (web app) and Fly.io (WebSocket server).

## Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed and authenticated
- [Fly.io CLI](https://fly.io/docs/flyctl/) installed and authenticated  
- PostgreSQL database (recommend [Neon](https://neon.tech/) or [Supabase](https://supabase.com/))
- Redis instance (recommend [Upstash](https://upstash.com/) or [Redis Cloud](https://redis.com/))
- SMTP service (recommend [Resend](https://resend.com/) or [SendGrid](https://sendgrid.com/))

## 1. Database Setup

### Option A: Neon (Recommended)

```bash
# Create Neon project at https://console.neon.tech/
# Copy the connection string

export DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Option B: Supabase

```bash
# Create Supabase project at https://app.supabase.com/
# Go to Settings > Database and copy the connection string

export DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"
```

## 2. Redis Setup

### Option A: Upstash (Recommended)

```bash
# Create database at https://console.upstash.com/
# Copy the Redis URL

export REDIS_URL="redis://default:pass@global-caring-bass-12345.upstash.io:6379"
```

### Option B: Redis Cloud

```bash
# Create database at https://app.redislabs.com/
export REDIS_URL="redis://default:pass@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345"
```

## 3. Email Service Setup

### Option A: Resend (Recommended)

```bash
# Sign up at https://resend.com/ and get API key
export SMTP_HOST="smtp.resend.com"
export SMTP_PORT="587"
export SMTP_USER="resend"
export SMTP_PASS="re_xxxxxxxx"
export EMAIL_FROM="noreply@yourdomain.com"
```

### Option B: SendGrid

```bash
# Get API key from https://app.sendgrid.com/
export SMTP_HOST="smtp.sendgrid.net"
export SMTP_PORT="587"
export SMTP_USER="apikey"
export SMTP_PASS="SG.xxxxxxxx"
export EMAIL_FROM="noreply@yourdomain.com"
```

## 4. Environment Secrets

Generate secure secrets:

```bash
# Generate JWT secret
export JWT_SECRET=$(openssl rand -base64 64)

# Generate magic link secret
export MAGICLINK_SECRET=$(openssl rand -base64 64)
```

## 5. Deploy Web Application (Vercel)

### Step 1: Login and Link Project

```bash
vercel login
cd apps/web
vercel link
```

### Step 2: Set Environment Variables

```bash
# Required variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add MAGICLINK_SECRET production
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add EMAIL_FROM production

# Will be set after realtime server deployment
vercel env add NEXT_PUBLIC_WS_URL production
vercel env add NEXT_PUBLIC_API_URL production
```

### Step 3: Deploy

```bash
vercel --prod
```

## 6. Deploy Realtime Server (Fly.io)

### Step 1: Create and Configure App

```bash
cd apps/realtime
flyctl apps create bullet-chess-realtime
```

### Step 2: Set Secrets

```bash
flyctl secrets set DATABASE_URL="$DATABASE_URL"
flyctl secrets set REDIS_URL="$REDIS_URL" 
flyctl secrets set JWT_SECRET="$JWT_SECRET"
flyctl secrets set MAGICLINK_SECRET="$MAGICLINK_SECRET"
flyctl secrets set NODE_ENV="production"
```

### Step 3: Deploy

```bash
flyctl deploy
```

### Step 4: Get WebSocket URL

```bash
flyctl info
# Copy the hostname, e.g., "bullet-chess-realtime.fly.dev"
```

## 7. Update Web App Configuration

Update the WebSocket URL in Vercel:

```bash
cd apps/web
vercel env add NEXT_PUBLIC_WS_URL production
# Enter: wss://bullet-chess-realtime.fly.dev

vercel env add NEXT_PUBLIC_API_URL production  
# Enter: https://your-web-app.vercel.app/api
```

Redeploy web app:

```bash
vercel --prod
```

## 8. Database Migration

Run initial migration:

```bash
# From project root
pnpm db:migrate
```

## 9. DNS and Domain Setup (Optional)

### Custom Domain for Web App

```bash
vercel domains add yourdomain.com
# Follow Vercel instructions to configure DNS
```

### Custom Domain for WebSocket

```bash
# In Fly.io dashboard, add custom domain
flyctl certs create ws.yourdomain.com
```

## 10. Monitoring and Alerts

### Vercel Analytics

Enable in Vercel dashboard for the web app.

### Fly.io Metrics

```bash
flyctl metrics --app bullet-chess-realtime
```

### Error Tracking

Consider adding [Sentry](https://sentry.io/) for error tracking:

```bash
npm install @sentry/nextjs @sentry/node
```

## 11. Environment Variables Reference

### Web App (Vercel)

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=base64-secret
MAGICLINK_SECRET=base64-secret
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_WS_URL=wss://bullet-chess-realtime.fly.dev
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

### Realtime Server (Fly.io)

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=base64-secret
MAGICLINK_SECRET=base64-secret
NODE_ENV=production
WS_PORT=8080
HEALTH_PORT=8081
```

## 12. Health Checks

After deployment, verify:

```bash
# Web app
curl https://yourdomain.com/api/auth/me

# Realtime server health
curl https://bullet-chess-realtime.fly.dev:8081/health

# WebSocket connection (using wscat)
wscat -c wss://bullet-chess-realtime.fly.dev
```

## 13. Scaling Configuration

### Fly.io Scaling

```bash
# Scale based on traffic
flyctl scale count 2  # Run 2 instances
flyctl scale vm shared-cpu-2x --memory 1024  # Increase resources
```

### Database Connection Pooling

For high traffic, consider connection pooling:

```bash
# Add to DATABASE_URL
?pgbouncer=true&connection_limit=10
```

## 14. Backup Strategy

### Database Backups

Neon and Supabase provide automatic backups. For manual backups:

```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Redis Backups

Upstash provides automatic backups. For Redis Cloud, configure in dashboard.

## 15. Cost Optimization

### Vercel
- Use Edge Functions for API routes when possible
- Optimize images and static assets
- Monitor usage in dashboard

### Fly.io
- Use scale-to-zero for development instances
- Monitor CPU and memory usage
- Consider auto-scaling based on connections

### Database
- Use read replicas for heavy read workloads
- Monitor connection counts
- Optimize queries and add indexes

## 16. Security Checklist

- ✅ HTTPS enforced on all domains
- ✅ Environment secrets properly set
- ✅ CORS configured correctly
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection headers
- ✅ Regular security updates

## Troubleshooting

### Common Issues

1. **WebSocket connection fails**
   - Check NEXT_PUBLIC_WS_URL is correct
   - Verify Fly.io app is running: `flyctl status`
   - Check browser console for errors

2. **Database connection errors**
   - Verify DATABASE_URL format
   - Check connection limits
   - Run `flyctl logs` to see server errors

3. **Email delivery issues**
   - Verify SMTP credentials
   - Check domain reputation
   - Test with `curl` or email testing tools

4. **High latency**
   - Monitor Fly.io region vs user location
   - Consider multiple regions deployment
   - Check database query performance

For more help, check the logs:

```bash
# Vercel logs
vercel logs

# Fly.io logs  
flyctl logs

# Database logs (Neon/Supabase dashboard)
```