# Resepti Admin - Recipe Management System

A full-stack recipe management application with Supabase backend, admin authentication, and CRUD operations.

## Features

✅ **Admin Authentication**
- Login/Signup with Supabase Auth
- Secure JWT tokens
- Protected admin routes

✅ **Recipe Management**
- View all recipes
- Add new recipes
- Edit existing recipes
- Delete recipes
- Store in Supabase database

✅ **User-Friendly Interface**
- Beautiful Finnish-language UI
- Responsive design
- Tab-based admin panel
- Real-time feedback messages

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://hkhxiyxdvwdlcckeiizz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_8bsb2FxBKpy5-VvOUeqV3Q_6CTmlnUn
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
NODE_ENV=development
```

**To get your Supabase keys:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing
3. In Project Settings > API, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable Key (anon) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - Service Role Key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Set Up Supabase Database

1. In Supabase dashboard, go to **SQL Editor**
2. Create a new query and paste the contents of `migrations/001_create_recipes_table.sql`
3. Execute the query

This creates:
- `recipes` table with all necessary columns
- Row-Level Security (RLS) policies
- Proper indexes for performance

### 4. Start the Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

### User Access
- Open `http://localhost:3000/`
- Browse recipes by category or search

### Admin Access
1. Visit `http://localhost:3000/login.html`
2. **First time?** Click "Luo tili" (Create account)
3. Sign up with email and password
4. After login, you'll be redirected to admin panel

### Admin Panel Features

#### 📋 Reseptit (View Recipes)
- See all recipes in the database
- Quick edit/delete buttons

#### ➕ Lisää resepti (Add Recipe)
- Fill in recipe details:
  - Name, description, image URL
  - Categories (comma-separated)
  - Ingredients (one per line)
  - Instructions (one per line)
- Submit to add to database

#### ✏️ Muokkaa reseptiä (Edit Recipe)
- Select a recipe from dropdown
- Modify any field
- Save changes to database
- Delete recipe if needed

## Project Structure

```
c:\Users\Minna\Desktop\a-vyo\
├── server.js                 # Express server & API routes
├── package.json             # Dependencies
├── .env.local              # Environment variables
├── migrations/
│   └── 001_create_recipes_table.sql  # Database schema
├── utils/
│   ├── supabase.js         # Supabase client
│   └── auth.js             # JWT authentication
├── public/
│   ├── login.html          # Login/signup page
│   ├── admin.html          # Admin panel
│   └── admin.js            # Admin panel logic
└── resepti/
    ├── index.html         # Main recipe page
    ├── styles.css          # Styles
    └── app.js              # Frontend recipe logic
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user (protected)

### Recipes (All endpoints require authentication for write operations)
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create recipe (protected)
- `PUT /api/recipes/:id` - Update recipe (protected)
- `DELETE /api/recipes/:id` - Delete recipe (protected)

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Port 3000 already in use
Change PORT in `.env.local`:
```env
PORT=3001
```

### Supabase connection errors
1. Check `.env.local` has correct keys
2. Verify database table exists (`migrations/001_create_recipes_table.sql`)
3. Check Supabase project is active

### Login issues
- Make sure `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- Verify Supabase Auth is enabled in project settings

## Data Migration

If you want to migrate existing recipes from `resepti/app.js` to Supabase:

1. Get the recipes array from `resepti/app.js`
2. In Supabase SQL Editor, run:
```sql
INSERT INTO recipes (title, description, image, categories, ingredientAmounts, instructions)
VALUES 
  ('Recipe Name', 'Description', 'https://...', '{"category1"}', '{"ingredient1", "ingredient2"}', '{"step1", "step2"}'),
  -- repeat for each recipe
```

## Security Notes

⚠️ **Important for Production:**
- Never commit `.env.local` to version control
- Use strong JWT_SECRET (generate with `openssl rand -base64 32`)
- Enable HTTPS
- Set proper CORS origins
- Implement rate limiting
- Use environment-specific Supabase projects

## Support & Questions

For issues with:
- **Supabase**: Visit [supabase.com/docs](https://supabase.com/docs)
- **Express**: Visit [expressjs.com](https://expressjs.com)
- **This project**: Check the code comments or raise an issue

---

Happy cooking! 👨‍🍳
