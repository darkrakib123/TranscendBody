# Transcend Your Body - Daily Fitness Tracker

A full-stack web application for tracking daily fitness activities across four key dimensions: workouts, nutrition, recovery, and mindset. Built with Node.js, Express, React, and PostgreSQL.

## Features

- **User Authentication**: Secure login with session management
- **Daily Activity Tracking**: Add and track activities across Morning, Afternoon, and Evening time slots
- **Progress Monitoring**: Real-time completion percentages and streak tracking
- **Activity Management**: Create custom activities or choose from 20+ preloaded activities
- **Admin Panel**: User management and activity oversight (admin users only)
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect) with session storage
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom themes

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd transcend-your-body-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/transcend_body_db
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=transcend_body_db

# Authentication
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Application
NODE_ENV=development
PORT=5000
```

### 4. Database Setup

Create your PostgreSQL database:

```sql
CREATE DATABASE transcend_body_db;
```

Push the database schema:

```bash
npm run db:push
```

Seed the database with initial activities:

```bash
npm run db:seed
```

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── App.tsx         # Main app component
│   └── index.html          # HTML template
├── server/                 # Backend Express application
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   ├── db.ts               # Database connection
│   └── replitAuth.ts       # Authentication setup
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema and types
├── package.json            # Dependencies and scripts
└── drizzle.config.ts       # Database configuration
```

## Database Schema

The application uses four main tables:

- **users**: User profiles and authentication data
- **activities**: Predefined and custom activities
- **daily_trackers**: Daily tracking sessions
- **tracker_entries**: Individual activity entries per day
- **sessions**: Session storage for authentication

## Authentication

The app uses Replit Auth for user authentication. When running locally, you'll need to:

1. Set up authentication with your preferred provider, or
2. Modify the auth system to use local authentication
3. Update the `ISSUER_URL` and related auth configuration

## Deployment

### Environment Variables for Production

Ensure these environment variables are set in your production environment:

- `DATABASE_URL`: Your production PostgreSQL connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `NODE_ENV=production`
- `PORT`: Port number for the server

### Build and Deploy

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please open an issue in the repository.