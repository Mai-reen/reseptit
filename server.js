import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import { authMiddleware, generateToken } from './utils/auth.js';
import { supabase, supabaseAdmin } from './utils/supabase.js';

const app = express();

// -----------------------------------------------------
// BASIC CONFIG
// -----------------------------------------------------

// Allow all Vercel preview deployments and production URLs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost',
  'https://reseptit-gamma.vercel.app',
  'https://reseptit.vercel.app',
  // Add wildcard for preview deployments
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.vercel\.app$/i
];

// -----------------------------------------------------
// MIDDLEWARE
// -----------------------------------------------------

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  
  // Less restrictive CSP for development
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:;"
    );
  }

  next();
});

// Enhanced CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });

      if (isAllowed) {
        return callback(null, true);
      }

      // For Vercel preview deployments, allow all
      if (origin.includes('vercel.app')) {
        return callback(null, true);
      }

      console.warn('CORS blocked origin:', origin);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serve static frontend from /public and root static files (index.html, styles.css, app.js)
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// -----------------------------------------------------
// COOKIE
// -----------------------------------------------------

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

// =====================================================
// HEALTH AND ROOT CHECKS
// =====================================================

// Root path handler - Vercel needs this
app.get('/', (req, res) => {
  // If root is requested, let static middleware serve index.html; but also provide JSON if Accept: application/json
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(200).json({
      status: 'ok',
      message: 'API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  }
  // otherwise, let static file be served
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', async (req, res) => {
  try {
    const { error } = await supabase.from('recipes').select('id', { head: true, count: 'exact' });
    if (error) {
      return res.status(200).json({ ok: true, message: 'API is running', supabase: 'error', error: error.message });
    }
    return res.status(200).json({ ok: true, message: 'API is running', supabase: 'connected' });
  } catch (error) {
    return res.status(200).json({ ok: true, message: 'API is running', supabase: 'error', error: error.message });
  }
});

// =====================================================
// AUTH ROUTES
// =====================================================

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    // If user created, optionally create token and set cookie (user may need to confirm email depending on Supabase settings)
    const userId = data.user?.id;
    if (userId) {
      const token = generateToken(userId);
      res.cookie('authToken', token, cookieOptions);
    }
    return res.status(200).json({ ok: true, user: data.user });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return res.status(401).json({ error: error?.message || 'Invalid credentials' });

    const userId = data.user.id;
    const token = generateToken(userId);
    res.cookie('authToken', token, cookieOptions);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken', { path: '/' });
  return res.status(200).json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  return res.status(200).json({ ok: true, user: req.user });
});

// =====================================================
// RECIPES ROUTES
// =====================================================

app.get('/api/recipes', async (req, res) => {
  try {
    const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  } catch (err) {
    console.error('Fetch recipes error:', err);
    return res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.post('/api/recipes', authMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    const insertObj = {
      title: payload.title || payload.name || 'Untitled',
      description: payload.description || null,
      image: payload.image || null,
      ingredientAmounts: Array.isArray(payload.ingredientAmounts) ? payload.ingredientAmounts : (typeof payload.ingredients === 'string' ? payload.ingredients.split('\n').map(s=>s.trim()).filter(Boolean) : []),
      categories: Array.isArray(payload.categories) ? payload.categories : (typeof payload.categories === 'string' ? payload.categories.split(',').map(s=>s.trim()).filter(Boolean) : []),
      instructions: Array.isArray(payload.instructions) ? payload.instructions : (typeof payload.instructions === 'string' ? payload.instructions.split('\n').map(s=>s.trim()).filter(Boolean) : []),
      created_by: req.user.userId
    };

    const { data, error } = await supabaseAdmin.from('recipes').insert([insertObj]).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data[0]);
  } catch (err) {
    console.error('Create recipe error:', err);
    return res.status(500).json({ error: 'Failed to create recipe' });
  }
});

app.put('/api/recipes/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    // Verify ownership
    const { data: existing, error: fetchErr } = await supabase.from('recipes').select('created_by').eq('id', id).single();
    if (fetchErr) return res.status(404).json({ error: 'Recipe not found' });
    if (existing.created_by !== req.user.userId) return res.status(403).json({ error: 'Not allowed' });

    const payload = req.body || {};
    const updateObj = {
      title: payload.title,
      description: payload.description,
      image: payload.image,
      ingredientAmounts: Array.isArray(payload.ingredientAmounts) ? payload.ingredientAmounts : (typeof payload.ingredients === 'string' ? payload.ingredients.split('\n').map(s=>s.trim()).filter(Boolean) : undefined),
      categories: Array.isArray(payload.categories) ? payload.categories : (typeof payload.categories === 'string' ? payload.categories.split(',').map(s=>s.trim()).filter(Boolean) : undefined),
      instructions: Array.isArray(payload.instructions) ? payload.instructions : (typeof payload.instructions === 'string' ? payload.instructions.split('\n').map(s=>s.trim()).filter(Boolean) : undefined),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin.from('recipes').update(updateObj).eq('id', id).select();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data[0]);
  } catch (err) {
    console.error('Update recipe error:', err);
    return res.status(500).json({ error: 'Failed to update recipe' });
  }
});

app.delete('/api/recipes/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  try {
    const { data: existing, error: fetchErr } = await supabase.from('recipes').select('created_by').eq('id', id).single();
    if (fetchErr) return res.status(404).json({ error: 'Recipe not found' });
    if (existing.created_by !== req.user.userId) return res.status(403).json({ error: 'Not allowed' });

    const { error } = await supabaseAdmin.from('recipes').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Delete recipe error:', err);
    return res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

// -----------------------------------------------------
// CATCH-ALL ROUTE
// -----------------------------------------------------

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path
  });
});

// -----------------------------------------------------
// ERROR HANDLER
// -----------------------------------------------------

app.use((error, req, res, next) => {
  console.error('Unhandled Express error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  if (res.headersSent) {
    return next(error);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(error.status || 500).json({
    error: isProduction ? 'Internal server error' : error.message,
    ...(isProduction ? {} : { stack: error.stack })
  });
});

// Export for Vercel or local start
export default app;
