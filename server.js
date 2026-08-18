import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authMiddleware, generateToken } from '../utils/auth.js';
import { supabase, supabaseAdmin } from '../utils/supabase.js';

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
      "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:;"
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
      return callback(null, false); // Changed to false instead of error
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

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
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  // Check Supabase connection
  try {
    // Simple ping to test Supabase
    supabase.from('recipes').select('count', { count: 'exact', head: true })
      .then(() => {
        res.status(200).json({
          ok: true,
          message: 'API is running',
          supabase: 'connected'
        });
      })
      .catch((dbError) => {
        console.error('Supabase health check failed:', dbError);
        res.status(200).json({
          ok: true,
          message: 'API is running',
          supabase: 'error',
          error: dbError.message
        });
      });
  } catch (error) {
    res.status(200).json({
      ok: true,
      message: 'API is running',
      supabase: 'error'
    });
  }
});

// =====================================================
// AUTHENTICATION ROUTES (Keep your existing routes)
// =====================================================

// ... (Keep all your existing auth, recipes routes here)

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

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(error.status || 500).json({
    error: isProduction ? 'Internal server error' : error.message,
    ...(isProduction ? {} : { stack: error.stack })
  });
});

// Export for Vercel
export default app;
