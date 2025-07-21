-- Migration: Add requiredPlayers column to rooms table
-- Run this SQL to add the requiredPlayers column

ALTER TABLE rooms 
ADD COLUMN required_players INTEGER DEFAULT 8;

-- Update existing rooms to have default required players
UPDATE rooms 
SET required_players = 8 
WHERE required_players IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE rooms 
ALTER COLUMN required_players SET NOT NULL; 