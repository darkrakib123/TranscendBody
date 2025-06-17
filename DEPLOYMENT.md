# Deployment Guide

## Overview
This guide covers deploying the Transcend Your Body tracker to various platforms.

## Platform Options

### 1. Railway (Recommended)
Railway provides PostgreSQL + Node.js hosting with automatic deployments.

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add --service postgresql
railway deploy
```

Environment variables for Railway:
```
DATABASE_URL=postgresql://... (automatically provided)
SESSION_SECRET=your-secure-secret-key
NODE_ENV=production
PORT=5000
```

### 2. Vercel + Neon
Vercel for hosting with Neon PostgreSQL database.

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ]
}
```

### 3. Render
Full-stack deployment with managed PostgreSQL.

Create `render.yaml`:
```yaml
services:
  - type: web
    name: transcend-tracker
    env: node
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: transcend-db
          property: connectionString
      - key: SESSION_SECRET
        generateValue: true

databases:
  - name: transcend-db
    databaseName: transcend_body_db
    user: transcend_user
```

### 4. Heroku
Traditional PaaS deployment.

```bash
# Create Heroku app
heroku create transcend-body-tracker

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

## Environment Configuration

### Production Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
PORT=5000

# Authentication
SESSION_SECRET=your-super-secure-production-secret
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id

# Optional: Custom domain
REPLIT_DOMAINS=yourdomain.com,www.yourdomain.com
```

### Security Checklist
- [ ] Strong SESSION_SECRET (64+ characters)
- [ ] DATABASE_URL uses SSL
- [ ] Environment variables are not committed to git
- [ ] HTTPS is enforced
- [ ] CORS is properly configured

## Database Migration

### From Development to Production
```bash
# Export development data
pg_dump transcend_body_db > backup.sql

# Import to production
psql $DATABASE_URL < backup.sql
```

### Schema Updates
```bash
# Push schema changes
npm run db:push

# Or generate and run migrations
npm run db:generate
npm run db:migrate
```

## Monitoring and Maintenance

### Health Check Endpoint
Add to `server/routes.ts`:
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Logging
Add structured logging:
```bash
npm install winston
```

### Error Tracking
Consider adding:
- Sentry for error tracking
- New Relic for performance monitoring
- DataDog for infrastructure monitoring

## Custom Domain Setup

### DNS Configuration
Add CNAME record:
```
www.yourdomain.com -> your-app.platform.com
```

### SSL Certificate
Most platforms provide automatic SSL certificates for custom domains.

## Backup Strategy

### Database Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_$DATE.sql"

# Upload to cloud storage
aws s3 cp "backup_$DATE.sql" s3://your-backup-bucket/
```

### File Backups
Since this is a database-driven app, focus on:
- Database backups
- Environment configuration
- Source code in git repository

## Performance Optimization

### Database Optimization
- Add indexes to frequently queried columns
- Use connection pooling
- Monitor slow queries

### Frontend Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement caching headers

### Server Optimization
- Use PM2 for process management
- Enable HTTP/2
- Implement rate limiting

## Rollback Strategy

### Database Rollbacks
```bash
# Rollback to previous backup
psql $DATABASE_URL < backup_previous.sql
```

### Application Rollbacks
- Use git tags for releases
- Implement blue-green deployments
- Keep previous version deployments available

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL format
2. **Authentication**: Verify REPL_ID and domains
3. **Build Errors**: Ensure all dependencies are in package.json
4. **Memory Issues**: Monitor and increase instance size if needed

### Debug Commands
```bash
# Check database connectivity
node -e "const { Pool } = require('pg'); new Pool({connectionString: process.env.DATABASE_URL}).query('SELECT NOW()').then(console.log)"

# Check environment variables
node -e "console.log(process.env)"

# Test build
npm run build
```