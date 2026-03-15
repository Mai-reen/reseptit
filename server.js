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

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost', 'https://reseptit-gamma.vercel.app', 'https://reseptit.vercel.app'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static(join(__dirname, 'resepti')));
app.use(express.static(join(__dirname, 'public')));

// ============ AUTHENTICATION ROUTES ============

// Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const token = generateToken(data.user.id);
    res.cookie('authToken', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    return res.status(200).json({ user: data.user, token });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const token = generateToken(data.user.id);
    res.cookie('authToken', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
    
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

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  try {
    const indexPath = join(__dirname, 'resepti', 'index.html');
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
