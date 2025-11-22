-- Add reference links columns to exercises table
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS songsterr_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT;