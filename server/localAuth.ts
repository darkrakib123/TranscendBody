import type { RequestHandler } from "express";
import { storage } from "./storage";

// Mock authentication for local development
// This allows you to test the app locally without Replit Auth
export const mockAuth: RequestHandler = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ message: "Mock auth not available in production" });
  }

  // Create or get mock user
  const mockUserId = 'local-dev-user';
  let user = await storage.getUser(mockUserId);
  
  if (!user) {
    user = await storage.upsertUser({
      id: mockUserId,
      email: 'dev@localhost.com',
      firstName: 'Local',
      lastName: 'Developer',
      profileImageUrl: null,
      role: 'admin' // Give admin access for local testing
    });
  }

  // Mock the user session structure that Replit Auth provides
  (req as any).user = {
    claims: {
      sub: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.profileImageUrl
    }
  };

  // Mock authentication state
  (req as any).isAuthenticated = () => true;

  next();
};

// Mock auth routes for local development
export const setupMockAuth = (app: any) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  app.get('/api/login', (req: any, res: any) => {
    res.redirect('/');
  });

  app.get('/api/logout', (req: any, res: any) => {
    res.redirect('/');
  });

  app.get('/api/callback', (req: any, res: any) => {
    res.redirect('/');
  });
};