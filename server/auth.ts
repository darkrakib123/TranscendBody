import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

export function setupAuthentication(app: Express) {
  // Session configuration
  const pgSession = connectPg(session);
  
  app.use(session({
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'sessions'
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    }
  }));

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for login
  passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Serialize/deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (error) {
      console.error('Deserialize user error:', error);
      done(null, false);
    }
  });

  // Flash messages middleware
  app.use((req, res, next) => {
    res.locals.success = (req.session as any)?.flash?.success || '';
    res.locals.error = (req.session as any)?.flash?.error || '';
    res.locals.user = req.user || null;
    res.locals.title = 'Dashboard';
    
    // Clear flash messages
    if ((req.session as any)?.flash) {
      delete (req.session as any).flash;
    }
    
    next();
  });
}

// Flash message helper
export function setFlash(req: any, type: 'success' | 'error', message: string) {
  if (!(req.session as any).flash) {
    (req.session as any).flash = {};
  }
  (req.session as any).flash[type] = message;
}

// Authentication middleware
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  setFlash(req, 'error', 'Please log in to access this page');
  res.redirect('/login');
};

// Admin middleware
export const requireAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    setFlash(req, 'error', 'Please log in to access this page');
    return res.redirect('/login');
  }

  const user = req.user as any;
  if (user?.role !== 'admin') {
    setFlash(req, 'error', 'Admin access required');
    return res.redirect('/dashboard');
  }

  next();
};