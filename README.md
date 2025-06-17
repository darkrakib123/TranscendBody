# Transcend Your Body - Daily Fitness Tracker

A full-stack web application for tracking daily fitness activities across four key dimensions: workouts, nutrition, recovery, and mindset. Built with Node.js, Express, EJS, and PostgreSQL using traditional server-side rendering.

## Features

- **User Authentication**: Secure login/registration with Passport.js and bcrypt password hashing
- **Daily Activity Tracking**: Add and track activities across Morning, Afternoon, and Evening time slots
- **Progress Monitoring**: Real-time completion percentages with Chart.js visualization
- **Activity Management**: Create custom activities or choose from 20+ preloaded activities
- **Admin Panel**: User management and activity oversight (admin users only)
- **Responsive Design**: Bootstrap-based responsive UI that works on all devices

## Tech Stack

- **Frontend**: EJS templates, Bootstrap 5, Chart.js, custom CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Authentication**: Passport.js with local strategy, bcrypt for password hashing
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with connect-pg-simple (PostgreSQL session store)
- **Environment**: dotenv for configuration management
- **Development**: tsx for TypeScript execution, nodemon for auto-restart

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## Local Development Setup (VS Code)

### 1. Download from Replit

1. In Replit, click the three dots menu (⋯) in the file tree
2. Select "Download as zip"
3. Extract the zip file to your desired location

### 2. Open in VS Code

```bash
cd transcend-your-body-tracker
code .
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set up PostgreSQL Database

Install PostgreSQL locally and create a database:

```sql
CREATE DATABASE transcend_body_db;
```

### 5. Environment Configuration

Create a `.env` file in the root directory:

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

### 6. Initialize Database

Push the database schema and seed with activities:

```bash
npm run db:push
tsx scripts/seed.ts
```

### 7. Run the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### 8. Create Admin Account

1. Register a new account at `http://localhost:5000/register`
2. Update the user role in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
├── views/                  # EJS templates
│   ├── layout.ejs          # Base layout template
│   ├── login.ejs           # Login page
│   ├── register.ejs        # Registration page
│   ├── dashboard.ejs       # Main dashboard
│   ├── progress.ejs        # Progress tracking page
│   └── admin.ejs           # Admin panel
├── public/                 # Static assets
│   ├── css/
│   │   └── style.css       # Custom styles
│   └── js/
│       └── app.js          # Client-side JavaScript
├── server/                 # Backend Express application
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # Web routes and API endpoints
│   ├── auth.ts             # Passport.js authentication
│   ├── storage.ts          # Database operations
│   └── db.ts               # Database connection
├── shared/                 # Shared schemas and types
│   └── schema.ts           # Drizzle database schema
├── scripts/                # Utility scripts
│   └── seed.ts             # Database seeding
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

The application uses Passport.js with local strategy for user authentication:

- **Registration**: Users can create accounts with email and password
- **Login**: Secure login with bcrypt password hashing
- **Sessions**: Server-side session management with PostgreSQL storage
- **Role-based Access**: Admin users have access to user management features
- **Password Security**: bcrypt hashing with salt rounds for secure password storage

### User Roles

- **User**: Can track daily activities and view personal progress
- **Admin**: Can manage users, activities, and access admin dashboard

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