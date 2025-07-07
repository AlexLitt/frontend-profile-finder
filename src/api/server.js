const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { createClient } = require('@supabase/supabase-js');

// COPILOT FIX AUTH-ENDPOINT
const app = express();

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase admin client (for server operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://app.profilefinder.com' 
    : 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));

// Middleware to extract and verify JWT
const requireAuth = async (req, res, next) => {
  try {
    // Get JWT from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    
    // Fetch user profile with role info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id) // Use id directly since users table uses auth.users.id
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({ error: 'Server error' });
    }
    
    // Add user info to request
    req.user = user;
    req.profile = profile;
    req.isAdmin = profile.role === 'admin';
    
    next();
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// Auth Routes
// GET /api/me - Returns current user info
app.get('/api/me', requireAuth, (req, res) => {
  const { user, profile } = req;
  
  res.json({
    id: user.id,
    email: user.email,
    role: profile.role,
    isAdmin: profile.role === 'admin',
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url
  });
});

// LOGOUT-FIX 1 - API logout endpoint
app.post('/api/logout', async (req, res) => {
  try {
    console.log('🔧 API logout: Processing logout request...');
    
    // Optional: Log the logout event
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        // Verify token to get user info for logging
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          console.log(`📝 User logout: ${user.email} (${user.id})`);
        }
      } catch (tokenError) {
        console.warn('⚠️ Could not verify token for logout logging:', tokenError);
      }
    }
    
    // For Supabase, most logout logic is handled client-side
    // This endpoint is mainly for logging and potential future server-side cleanup
    
    console.log('✅ API logout: Server-side logout completed');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('💥 API logout error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// POST /api/admin/users - Admin endpoint to list all users
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*');
      
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Temporary endpoint to fix admin role (remove after fixing)
app.post('/api/fix-admin-role', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Update the profile role to admin
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Failed to update profile', details: error });
    }
    
    return res.json({ 
      success: true, 
      message: 'Profile role updated to admin',
      data 
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy all other requests to n8n or other backend services
app.use('/api/search', createProxyMiddleware({
  target: process.env.SEARCH_API_URL || 'http://localhost:5678',
  changeOrigin: true,
  pathRewrite: {
    '^/api/search': '/'
  },
  onProxyReq: (proxyReq, req) => {
    // Add auth headers or logging as needed
    console.log('Proxying search request:', {
      method: req.method,
      url: req.url,
    });
  }
}));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
