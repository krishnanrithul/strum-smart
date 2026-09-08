-- Add difficulty column to exercises table
ALTER TABLE exercises
ADD COLUMN difficulty TEXT DEFAULT 'Intermediate'
CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));
