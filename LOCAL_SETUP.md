# Local Development Setup Guide

This guide will help you set up the Transcend Your Body tracker on your local machine with VS Code.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
3. **VS Code** - [Download](https://code.visualstudio.com/)
4. **Git** - [Download](https://git-scm.com/)

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd transcend-your-body-tracker

# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb transcend_body_db

# Or using psql
psql -U postgres
CREATE DATABASE transcend_body_db;
\q
```

#### Option B: Using Docker
```bash
# Run PostgreSQL in Docker
docker run --name transcend-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=transcend_body_db \
  -p 5432:5432 \
  -d postgres:14

# Wait for container to start
docker ps
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env  # or use VS Code: code .env
```

Example `.env` for local development:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/transcend_body_db
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=yourpassword
PGDATABASE=transcend_body_db
SESSION_SECRET=your-super-secret-key-change-this
NODE_ENV=development
PORT=5000
```

### 4. Database Schema and Seeding

```bash
# Push database schema
npm run db:push

# Seed with initial activities
npm run db:seed

# (Optional) Open database studio
npm run db:studio
```

### 5. Authentication Setup

For local development, you have two options:

#### Option A: Use Replit Auth (Recommended)
1. Keep your Replit app running
2. Add your local domain to REPLIT_DOMAINS in your Replit environment
3. Update your `.env`:
```env
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id-here
REPLIT_DOMAINS=localhost:5000
```

#### Option B: Mock Authentication (Development Only)
Create `server/localAuth.ts` for development:
```typescript
// Simple mock auth for local development
export const mockAuth = (req: any, res: any, next: any) => {
  req.user = {
    claims: {
      sub: 'local-user-1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    }
  };
  next();
};
```

### 6. VS Code Extensions (Recommended)

Install these extensions for the best development experience:

- **TypeScript Importer** - Auto import TypeScript modules
- **Tailwind CSS IntelliSense** - Tailwind CSS autocomplete
- **ES7+ React/Redux/React-Native snippets** - React snippets
- **PostgreSQL** - Database management
- **Prettier** - Code formatting
- **ESLint** - Code linting

### 7. Running the Application

```bash
# Start development server
npm run dev

# Open in browser
open http://localhost:5000
```

### 8. Development Workflow

```bash
# Type checking
npm run check

# Build for production
npm run build

# Start production server
npm run start

# Database operations
npm run db:push      # Push schema changes
npm run db:seed      # Seed data
npm run db:studio    # Open database studio
```

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -d transcend_body_db

# Check if PostgreSQL is running
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### TypeScript Errors
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run check
```

## Production Deployment

### Build Process
```bash
npm run build
```

### Environment Variables
Ensure these are set in production:
- `DATABASE_URL` - Your production database URL
- `SESSION_SECRET` - Secure random string
- `NODE_ENV=production`
- `PORT` - Server port

### Deploy to Vercel/Netlify/Railway
The app is configured for deployment on:
- **Vercel**: Automatic deployment from GitHub
- **Railway**: PostgreSQL + Node.js hosting
- **Render**: Full-stack deployment

## File Structure Reference

```
transcend-your-body-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components  
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── index.ts            # Server entry
│   ├── routes.ts           # API routes
│   ├── db.ts               # Database connection
│   └── storage.ts          # Data operations
├── shared/                 # Shared types
│   └── schema.ts           # Database schema
├── scripts/                # Utility scripts
│   └── seed.ts             # Database seeding
├── .env.example            # Environment template
├── README.md               # Main documentation
└── package.json            # Dependencies
```

## Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run check              # Type check
npm run build              # Build for production

# Database
npm run db:push            # Update schema
npm run db:seed            # Seed data
npm run db:studio          # Database GUI

# Production
npm run start              # Start production server
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment variables
3. Ensure PostgreSQL is running
4. Check the browser console for errors