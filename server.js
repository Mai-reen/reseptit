import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env.local') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import { join } from 'path';
import { authMiddleware, generateToken, verifyToken } from './utils/auth.js';

const { supabase } = await import('./utils/supabase.js');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Security: Set secure cookie flags based on environment
const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // HTTPS only in production
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https:; font-src 'self'; connect-src 'self' https:");
  next();
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost', 'https://reseptit-gamma.vercel.app', 'https://reseptit.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Serve CSS file
app.get('/styles.css', (req, res) => {
  try {
    const css = fs.readFileSync(join(__dirname, 'styles.css'), 'utf-8');
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.send(css);
  } catch (error) {
    console.error('Error serving styles.css:', error);
    res.status(404).send('Not found');
  }
});

// Serve app.js file
app.get('/app.js', (req, res) => {
  try {
    const js = fs.readFileSync(join(__dirname, 'app.js'), 'utf-8');
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.send(js);
  } catch (error) {
    console.error('Error serving app.js:', error);
    res.status(404).send('Not found');
  }
});

// Serve static files as fallback
app.use(express.static(__dirname));
app.use(express.static(join(__dirname, 'public')));

// ============ AUTHENTICATION ROUTES ============

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const token = generateToken(data.user.id);
    res.cookie('authToken', token, cookieOptions);
    
    return res.status(200).json({ user: data.user, token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const token = generateToken(data.user.id);
    res.cookie('authToken', token, cookieOptions);
    
    return res.status(200).json({ user: data.user, token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('authToken');
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ============ RECIPE ROUTES ============

// Get all recipes
app.get('/api/recipes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get single recipe
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Create recipe (admin only)
app.post('/api/recipes', authMiddleware, async (req, res) => {
  try {
    const { title, description, ingredientAmounts, categories, image, instructions } = req.body;
    
    // Input validation
    if (!title || !description || !image) {
      return res.status(400).json({ error: 'Title, description, and image are required' });
    }
    
    const { data, error } = await supabase
      .from('recipes')
      .insert([
        {
          title,
          description,
          ingredientAmounts,
          categories,
          image,
          instructions,
          created_by: req.user.userId,
        }
      ])
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update recipe (admin only)
app.put('/api/recipes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, ingredientAmounts, categories, image, instructions } = req.body;
    
    const { data, error } = await supabase
      .from('recipes')
      .update({
        title,
        description,
        ingredientAmounts,
        categories,
        image,
        instructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete recipe (admin only)
app.delete('/api/recipes/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ============ URL REWRITING (hide .html extensions) ============

// Login page (no auth required)
app.get('/login', (req, res) => {
  try {
    const html = fs.readFileSync(join(__dirname, 'public', 'login.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error serving login page:', error);
    res.status(404).send('Not found');
  }
});

// Admin page (auth required)
app.get('/admin', authMiddleware, (req, res) => {
  try {
    const html = fs.readFileSync(join(__dirname, 'public', 'admin.html'), 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Error serving admin page:', error);
    res.status(404).send('Not found');
  }
});

// Serve index.html for all other routes (SPA fallback) - but skip files with extensions
app.get('*', (req, res) => {
  // Don't serve HTML for requests with file extensions
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  
  try {
    const indexPath = join(__dirname, 'index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(404).send('Not found');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
