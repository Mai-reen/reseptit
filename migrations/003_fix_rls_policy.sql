-- Fix RLS policy for recipes INSERT
-- Ensure that created_by must match the authenticated user's ID

-- Drop the old policy
DROP POLICY IF EXISTS "Allow authenticated to create recipes" ON recipes;

-- Create the fixed policy that enforces created_by = auth.uid()
CREATE POLICY "Allow authenticated to create recipes"
ON recipes FOR INSERT
WITH CHECK (
  auth.uid() = created_by 
  AND auth.role() = 'authenticated'
);
