-- Create role_type enum for game roles
CREATE TYPE role_type AS ENUM ('mafia', 'citizen', 'villain');

-- Users table
CREATE TABLE users (
  userId        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userEmail     TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nickname      VARCHAR(10) UNIQUE NOT NULL,
  img_url       TEXT,
  created_at    TIMESTAMP DEFAULT now()
);

-- Games table (records of each game round)
CREATE TABLE games (
  gameId       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at   TIMESTAMP NOT NULL,
  ended_at     TIMESTAMP NOT NULL,
  winner_team  TEXT CHECK (winner_team IN ('mafia','citizen','villain'))
);

-- Rooms table (waiting rooms/game rooms)
CREATE TABLE rooms (
  roomId        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id  UUID REFERENCES users(userId) ON DELETE SET NULL,
  status        TEXT CHECK (status IN ('waiting', 'in_progress', 'finished')) DEFAULT 'waiting',
  created_at    TIMESTAMP DEFAULT now(),
  gameId        UUID REFERENCES games(gameId) ON DELETE SET NULL
);

-- Game participants table
CREATE TABLE game_participants (
  gameId    UUID REFERENCES games(gameId) ON DELETE CASCADE,
  userId    UUID REFERENCES users(userId) ON DELETE CASCADE,
  role      role_type,
  isWinner  BOOLEAN,
  PRIMARY KEY (gameId, userId)
); 