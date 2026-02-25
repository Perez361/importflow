-- Migration: Add avatar_url to users table

-- Add avatar_url column to users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for avatar lookups
CREATE INDEX IF NOT EXISTS idx_users_avatar 
ON users(avatar_url) 
WHERE avatar_url IS NOT NULL;
