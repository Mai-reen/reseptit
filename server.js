import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authMiddleware, generateToken } from '../utils/auth.js';
import { supabase, supabaseAdmin } from '../utils/supabase.js';

const app = express();

// -----------------------------------------------------
// BASIC CONFIG
// -----------------------------------------------------

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost',
  'https://reseptit-gamma.vercel.app',
  'https://reseptit.vercel.app'
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

  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data: https:; " +
      "connect-src 'self' https:;"
  );

  next();
});

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header
      // such as server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin not allowed'));
    },
    credentials: true
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

// -----------------------------------------------------
// HEALTH CHECK
// -----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    message: 'API is running'
  });
});

// =====================================================
// AUTHENTICATION
// =====================================================

// -----------------------------------------------------
// SIGNUP
// -----------------------------------------------------

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('Signup error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    if (!data?.user) {
      return res.status(400).json({
        error: 'Unable to create user'
      });
    }

    const token = generateToken(data.user.id);

    res.cookie('authToken', token, cookieOptions);

    return res.status(200).json({
      user: data.user
    });
  } catch (error) {
    console.error('Signup exception:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    if (!data?.user) {
      return res.status(401).json({
        error: 'Invalid login'
      });
    }

    const token = generateToken(data.user.id);

    res.cookie('authToken', token, cookieOptions);

    return res.status(200).json({
      user: data.user
    });
  } catch (error) {
    console.error('Login exception:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// -----------------------------------------------------
// LOGOUT
// -----------------------------------------------------

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  return res.status(200).json({
    message: 'Logged out successfully'
  });
});

// -----------------------------------------------------
// CURRENT USER
// -----------------------------------------------------

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({
      user: {
        id: req.user.userId
      }
    });
  } catch (error) {
    console.error('Auth/me error:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// =====================================================
// RECIPES
// =====================================================

// -----------------------------------------------------
// GET ALL RECIPES
// -----------------------------------------------------

app.get('/api/recipes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Get recipes error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(200).json(data ?? []);
  } catch (error) {
    console.error('Get recipes exception:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// -----------------------------------------------------
// GET SINGLE RECIPE
// -----------------------------------------------------

app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get recipe error:', error);

      return res.status(404).json({
        error: error.message
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Get recipe exception:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// =====================================================
// ADMIN RECIPE MANAGEMENT
// =====================================================

// -----------------------------------------------------
// CREATE RECIPE
// -----------------------------------------------------

app.post('/api/recipes', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      ingredientAmounts,
      categories,
      image,
      instructions
    } = req.body ?? {};

    if (!title || !description || !image) {
      return res.status(400).json({
        error: 'Title, description, and image are required'
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('recipes')
      .insert([
        {
          title,
          description,
          ingredientAmounts,
          categories,
          image,
          instructions,
          created_by: req.user.userId
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Create recipe error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('Create recipe exception:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// -----------------------------------------------------
// UPDATE RECIPE
// -----------------------------------------------------

app.put('/api/recipes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      ingredientAmounts,
      categories,
      image,
      instructions
    } = req.body ?? {};

    const { data, error } = await supabaseAdmin
      .from('recipes')
      .update({
        title,
        description,
        ingredientAmounts,
        categories,
        image,
        instructions,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update recipe error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Update recipe exception:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// -----------------------------------------------------
// DELETE RECIPE
// -----------------------------------------------------

app.delete('/api/recipes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete recipe error:', error);

      return res.status(400).json({
        error: error.message
      });
    }

    return res.status(200).json({
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Delete recipe exception:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// -----------------------------------------------------
// UNKNOWN API ROUTE
// -----------------------------------------------------

app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found'
  });
});

// -----------------------------------------------------
// ERROR HANDLER
// -----------------------------------------------------

app.use((error, req, res, next) => {
  console.error('Unhandled Express error:', error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).json({
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
          ? error.message
          : 'Internal server error'
  });
});

// IMPORTANT:
// Do NOT use app.listen() on Vercel.
// Vercel invokes this exported Express application.
export default app;
