// COPILOT FIX AUTH-CALLBACK
import { supabase } from '../../lib/supabase';
import { NextFunction, Request, Response } from 'express';

/**
 * Express middleware to require authentication
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get JWT from request header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({ error: 'Server error' });
    }
    
    // Add user and profile to request for later use
    req.user = user;
    req.profile = profile;
    req.isAdmin = profile.role === 'admin';
    
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Express middleware to require admin role
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Run auth middleware first
    await requireAuth(req, res, async () => {
      // Now check if user is admin
      if (!req.isAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
      
      next();
    });
  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Type declaration for Express Request
 */
declare global {
  namespace Express {
    interface Request {
      user: any;
      profile: any;
      isAdmin: boolean;
    }
  }
}
