-- Add session feedback columns
ALTER TABLE sessions
ADD COLUMN feedback TEXT,
ADD COLUMN feedback_by UUID REFERENCES profiles(id),
ADD COLUMN feedback_created_at TIMESTAMP;

-- Add custom exercise tracking to exercises table
ALTER TABLE exercises
ADD COLUMN is_custom BOOLEAN DEFAULT FALSE,
ADD COLUMN created_by UUID REFERENCES profiles(id),
ADD COLUMN custom_description TEXT;

-- Index for faster feedback lookups
CREATE INDEX idx_sessions_feedback_by ON sessions(feedback_by);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);
