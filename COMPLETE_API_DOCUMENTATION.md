# Scary Mafia Backend - Complete API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Room Management](#room-management)
5. [Game Logic](#game-logic)
6. [Night Action System](#night-action-system)
7. [Voting System](#voting-system)
8. [Game Management](#game-management)
9. [Game Participants](#game-participants)
10. [Redis Management](#redis-management)
11. [Data Models](#data-models)
12. [Error Handling](#error-handling)

---

## Overview

**Base URL**: `http://localhost:8000`

**Technology Stack**:
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis for real-time data
- **Authentication**: Basic auth (no JWT currently)

**Key Features**:
- Real-time room management with Redis
- Auto-start game functionality
- Complete Mafia game mechanics with night actions
- Role-based gameplay (Mafia, Police, Doctor, Citizen, Villain)
- Night action selection system with Redis tracking
- Voting system with duplicate vote prevention

---

## Authentication

### User Registration
**POST** `/auth/signup`

Register a new user account.

**Request Body**:
```json
{
  "userEmail": "user@example.com",
  "password": "password123",
  "nickname": "player1"
}
```

**Validation Rules**:
- `userEmail`: Valid email address
- `password`: Minimum 6 characters
- `nickname`: Maximum 10 characters, unique

**Response (200)**:
```json
{
  "message": "User created successfully",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userEmail": "user@example.com",
  "nickname": "player1"
}
```

### User Login
**POST** `/auth/login`

Authenticate user credentials.

**Request Body**:
```json
{
  "userEmail": "user@example.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "message": "Login successful",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "userEmail": "user@example.com",
  "nickname": "player1"
}
```

---

## User Management

### Get All Users
**GET** `/users/list`

**Response (200)**:
```json
[
  {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "userEmail": "user@example.com",
    "nickname": "player1",
    "created_at": "2024-01-01T00:00:00.000Z",
    "img_url": "https://example.com/avatar.jpg"
  }
]
```

### Get User by ID
**GET** `/users/userId/{userId}`

### Get User by Nickname
**GET** `/users/nickname/{nickname}`

### Get User by Email
**GET** `/users/email/{email}`

### Get User Count
**GET** `/users/count`

**Response (200)**: `42`

### Update User
**PUT** `/users/{userId}`

**Request Body**:
```json
{
  "userEmail": "newemail@example.com",
  "nickname": "newplayer",
  "img_url": "https://example.com/new-avatar.jpg"
}
```

---

## Room Management

### Create Room
**POST** `/rooms`

Create a new game room with auto-start functionality.

**Request Body**:
```json
{
  "title": "Mafia Game Room",
  "notes": "Welcome to the game!",
  "hostUserId": "123e4567-e89b-12d3-a456-426614174000",
  "requiredPlayers": 8
}
```

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "title": "Mafia Game Room",
  "notes": "Welcome to the game!",
  "status": "waiting",
  "created_at": "2024-01-01T00:00:00.000Z",
  "requiredPlayers": 8,
  "hostUser": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "nickname": "player1"
  }
}
```

### Update Room
**PUT** `/rooms/{roomId}`

### Get Room
**GET** `/rooms/{roomId}`

### Delete Room
**DELETE** `/rooms/{roomId}`

### Join Room
**POST** `/rooms/{roomId}/join`

**Request Body**:
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (200) - Game Auto-Started**:
```json
{
  "message": "Game started! 8 players joined.",
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "gameStarted": true,
  "waitingMessage": "Game started! 8 players joined."
}
```

### Leave Room
**POST** `/rooms/{roomId}/leave`

### Get Room Participants
**GET** `/rooms/{roomId}/participants`

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "participants": [
    "123e4567-e89b-12d3-a456-426614174000",
    "789e0123-e89b-12d3-a456-426614174000"
  ],
  "count": 2,
  "requiredPlayers": 8,
  "canStartGame": false,
  "reason": "Need at least 8 players to start. Current: 2"
}
```

### Get User's Current Room
**GET** `/rooms/current/{userId}`

### Leave Current Room
**POST** `/rooms/leave-current`

### Check if Game Can Start
**GET** `/rooms/{roomId}/can-start`

### Get All Waiting Rooms
**GET** `/rooms/waiting`

### Start Game (Manual)
**POST** `/rooms/{roomId}/start-game`

---

## Game Logic

### Get Game State
**GET** `/game-logic/state/{roomId}`

Get the complete game state for a room (admin/development use).

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "night",
  "dayNumber": 1,
  "players": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "nickname": "player1",
      "role": "mafia",
      "isAlive": true,
      "voteTarget": null,
      "isProtected": false,
      "lastAction": null
    }
  ],
  "eliminatedPlayers": [],
  "voteResults": {},
  "nightActions": {
    "mafiaTarget": null,
    "policeTarget": null,
    "villainTarget": null
  },
  "settings": {}
}
```

### Get Public Game State
**GET** `/game-logic/public-state/{roomId}`

Get public game state without revealing roles (for players).

**Query Parameters**:
- `userId` (optional): Requesting user's ID to show their own role

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "night",
  "dayNumber": 1,
  "winner": null,
  "players": [
    {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "nickname": "player1",
      "isAlive": true,
      "role": "mafia" // Only shown if userId matches
    }
  ],
  "eliminatedPlayers": []
}
```

### Transition to Night Phase
**POST** `/game-logic/transition-night/{roomId}`

Transition game from day to night phase.

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "night",
  "dayNumber": 1,
  "players": [...],
  "eliminatedPlayers": [],
  "voteResults": {},
  "nightActions": {},
  "settings": {}
}
```

### Transition to Night Result
**POST** `/game-logic/transition-night-result/{roomId}`

Process night actions and transition to night result phase.

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "night_result",
  "dayNumber": 1,
  "players": [...],
  "eliminatedPlayers": ["789e0123-e89b-12d3-a456-426614174000"],
  "voteResults": {},
  "nightActions": {
    "mafiaTarget": "789e0123-e89b-12d3-a456-426614174000"
  },
  "settings": {}
}
```

### Transition to Day Phase
**POST** `/game-logic/transition-day/{roomId}`

Transition from night result to day discussion phase.

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "day",
  "dayNumber": 2,
  "players": [...],
  "eliminatedPlayers": ["789e0123-e89b-12d3-a456-426614174000"],
  "voteResults": {},
  "nightActions": {},
  "settings": {}
}
```

### Transition to Vote Phase
**POST** `/game-logic/transition-vote/{roomId}`

Transition from day discussion to voting phase.

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "vote",
  "dayNumber": 2,
  "players": [...],
  "eliminatedPlayers": ["789e0123-e89b-12d3-a456-426614174000"],
  "voteResults": {},
  "nightActions": {},
  "settings": {}
}
```

### Transition to Day Result
**POST** `/game-logic/transition-day-result/{roomId}`

Process votes and transition to day result phase.

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "day_result",
  "dayNumber": 2,
  "players": [...],
  "eliminatedPlayers": [
    "789e0123-e89b-12d3-a456-426614174000",
    "abc12345-e89b-12d3-a456-426614174000"
  ],
  "voteResults": {
    "abc12345-e89b-12d3-a456-426614174000": 3,
    "def67890-e89b-12d3-a456-426614174000": 2
  },
  "nightActions": {},
  "settings": {}
}
```

### Check Win Conditions
**GET** `/game-logic/check-win/{roomId}`

Check if the game should end based on current player state.

**Response (200) - Game Continues**:
```json
{
  "gameEnded": false
}
```

**Response (200) - Game Ended**:
```json
{
  "gameEnded": true,
  "winner": "mafia"
}
```

### Get Player State
**GET** `/game-logic/player/state`

Get a specific player's complete state in an active game.

**Request Body**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (200)**:
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "nickname": "player1",
  "role": "mafia",
  "isAlive": true,
  "voteTarget": null,
  "isProtected": false,
  "lastAction": null
}
```

---

## Night Action System

### Mafia Night Action
**POST** `/game-logic/night-action/mafia/{roomId}`

Mafia selects a player to kill during night phase.

**Request Body**:
```json
{
  "userId": "mafia-user-id",
  "targetUserId": "victim-user-id"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "mafia selected player2 as target",
  "role": "mafia",
  "targetUserId": "victim-user-id",
  "allActionsComplete": false
}
```

**Response (200) - All Actions Complete**:
```json
{
  "success": true,
  "message": "mafia selected player2 as target",
  "role": "mafia",
  "targetUserId": "victim-user-id",
  "allActionsComplete": true
}
```

### Doctor Night Action
**POST** `/game-logic/night-action/doctor/{roomId}`

Doctor selects a player to protect during night phase.

**Request Body**:
```json
{
  "userId": "doctor-user-id",
  "targetUserId": "patient-user-id"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "doctor selected player3 as target",
  "role": "doctor",
  "targetUserId": "patient-user-id",
  "allActionsComplete": false
}
```

### Police Night Action
**POST** `/game-logic/night-action/police/{roomId}`

Police selects a player to investigate during night phase.

**Request Body**:
```json
{
  "userId": "police-user-id",
  "targetUserId": "suspect-user-id"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "police selected player4 as target",
  "role": "police",
  "targetUserId": "suspect-user-id",
  "allActionsComplete": false
}
```

### Get Night Actions
**GET** `/game-logic/night-actions/{roomId}`

Get all night action selections for the current day (for game master/host).

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "dayNumber": 1,
  "actions": {
    "mafiaTarget": "victim-user-id",
    "doctorTarget": "patient-user-id",
    "policeTarget": "suspect-user-id"
  }
}
```

### Get Night Action Status
**GET** `/game-logic/night-action-status/{roomId}`

Check if all required roles have made their night action selections.

**Response (200)**:
```json
{
  "mafiaSelected": true,
  "doctorSelected": true,
  "policeSelected": true,
  "allComplete": true
}
```

**Response (200) - Incomplete**:
```json
{
  "mafiaSelected": true,
  "doctorSelected": false,
  "policeSelected": true,
  "allComplete": false
}
```

### Get Police Investigation Results
**GET** `/game-logic/police-investigation-result/{roomId}`

Get police investigation results (available during day phase or later).

**Response (200) - During Day Phase**:
```json
{
  "success": true,
  "message": "Investigation results for day 1",
  "dayNumber": 1,
  "gamePhase": "day",
  "investigationResults": [
    {
      "targetUserId": "player2-id",
      "targetNickname": "player2",
      "targetRole": "mafia",
      "isAlive": true
    },
    {
      "targetUserId": "player5-id",
      "targetNickname": "player5", 
      "targetRole": "citizen",
      "isAlive": false
    }
  ]
}
```

**Response (200) - During Night Phase**:
```json
{
  "success": false,
  "message": "Investigation results are not available during night phase",
  "investigationResults": null
}
```

### Get All Police Investigation Results
**GET** `/game-logic/police-investigation-results/{roomId}`

Get all police investigation results (for game master/host).

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "dayNumber": 1,
  "investigationResults": {
    "player2": "mafia",
    "player5": "citizen"
  }
}
```

---

## Voting System

### Submit Vote
**POST** `/game-logic/vote/{roomId}`

Submit a vote to eliminate a player during vote phase.

**Request Body**:
```json
{
  "userId": "voter-user-id",
  "targetUserId": "target-user-id"
}
```

**Response (200) - Success**:
```json
{
  "success": true,
  "message": "player1 voted to eliminate player2",
  "voteCount": 6,
  "allVotesComplete": false
}
```

**Response (200) - All Votes Complete**:
```json
{
  "success": true,
  "message": "player1 voted to eliminate player2",
  "voteCount": 6,
  "allVotesComplete": true
}
```

**Error Responses**:

**Already Voted (400)**:
```json
{
  "statusCode": 400,
  "message": "player1 has already voted to eliminate player2. You cannot vote again.",
  "error": "Bad Request"
}
```

**Self-Voting (400)**:
```json
{
  "statusCode": 400,
  "message": "player1 cannot vote to eliminate themselves.",
  "error": "Bad Request"
}
```

**Wrong Phase (400)**:
```json
{
  "statusCode": 400,
  "message": "Voting can only be done during vote phase",
  "error": "Bad Request"
}
```

**Player Not Found (400)**:
```json
{
  "statusCode": 400,
  "message": "Player not found or not alive",
  "error": "Bad Request"
}
```

**Target Not Found (400)**:
```json
{
  "statusCode": 400,
  "message": "Target player not found or not alive",
  "error": "Bad Request"
}
```

### Get Vote Status
**GET** `/game-logic/vote-status/{roomId}`

Get current vote counts and leading targets.

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "dayNumber": 1,
  "votes": {
    "player1-id": "player2-id",
    "player3-id": "player1-id", 
    "player4-id": "player2-id",
    "player5-id": "player2-id"
  },
  "voteCounts": {
    "player1-id": 1,
    "player2-id": 3
  },
  "topTargets": ["player2-id"],
  "maxVotes": 3,
  "tie": false
}
```

**Response (200) - Tie**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "dayNumber": 1,
  "votes": {
    "player1-id": "player2-id",
    "player3-id": "player1-id", 
    "player4-id": "player2-id",
    "player5-id": "player1-id"
  },
  "voteCounts": {
    "player1-id": 2,
    "player2-id": 2
  },
  "topTargets": ["player1-id", "player2-id"],
  "maxVotes": 2,
  "tie": true
}
```

### Get Vote Completion
**GET** `/game-logic/vote-completion/{roomId}`

Check which players still need to vote.

**Response (200) - Incomplete**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "dayNumber": 1,
  "totalAlivePlayers": 6,
  "votedPlayers": 4,
  "remainingPlayers": [
    {
      "userId": "player5-id",
      "nickname": "player5"
    },
    {
      "userId": "player6-id", 
      "nickname": "player6"
    }
  ],
  "allVotesComplete": false
}
```

**Response (200) - Complete**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "dayNumber": 1,
  "totalAlivePlayers": 6,
  "votedPlayers": 6,
  "remainingPlayers": [],
  "allVotesComplete": true
}
```

---

## Game Management

### Create Game
**POST** `/games`

**Request Body**:
```json
{
  "started_at": "2024-01-01T10:00:00.000Z",
  "ended_at": "2024-01-01T11:00:00.000Z",
  "winner_team": "citizen"
}
```

### Get All Games
**GET** `/games/list`

### Get Game Count
**GET** `/games/count`

### Get Game by ID
**GET** `/games/{gameId}`

---

## Game Participants

### Create Game Participant
**POST** `/game-participants`

**Request Body**:
```json
{
  "gameId": "789e0123-e89b-12d3-a456-426614174000",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "role": "citizen",
  "isWinner": true
}
```

### Get Participants by Game
**GET** `/game-participants/game/{gameId}`

### Get Participant Games by User
**GET** `/game-participants/user/{userId}`

### Get Specific Participant
**GET** `/game-participants/{gameId}/{userId}`

### Remove Participant
**DELETE** `/game-participants/{gameId}/{userId}`

### Get User Statistics
**GET** `/game-participants/user/{userId}/stats`

**Response (200)**:
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "totalGames": 10,
  "wins": 6,
  "losses": 4,
  "winRate": 0.6,
  "roleStats": {
    "mafia": { "games": 3, "wins": 2 },
    "citizen": { "games": 5, "wins": 3 },
    "villain": { "games": 2, "wins": 1 }
  }
}
```

### Get Game Winners
**GET** `/game-participants/game/{gameId}/winners`

---

## Redis Management

### Test Redis Connection
**GET** `/redis/test`

**Response (200)**:
```json
{
  "success": true,
  "message": "Redis is connected!",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### Get Redis Status
**GET** `/redis/status`

**Response (200)**:
```json
{
  "connected": true,
  "status": "connected",
  "info": {
    "ping": "PONG",
    "serverInfo": "Redis server info..."
  }
}
```

### Redis Ping
**GET** `/redis/ping`

**Response (200)**:
```json
{
  "pong": true,
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

---

## Data Models

### Game Phase Enum
```typescript
enum GamePhase {
  STARTING = 'starting',
  NIGHT = 'night',
  NIGHT_RESULT = 'night_result',
  DAY = 'day',
  VOTE = 'vote',
  DAY_RESULT = 'day_result',
  MAFIA_WINS = 'mafia_wins',
  CITIZENS_WINS = 'citizens_wins',
  VILLAGE_WINS = 'village_wins'
}
```

### Role Type Enum
```typescript
enum RoleType {
  MAFIA = 'mafia',
  POLICE = 'police',
  DOCTOR = 'doctor',
  CITIZEN = 'citizen',
  VILLAIN = 'villain'
}
```

### Player State Interface
```typescript
interface PlayerState {
  userId: string;
  nickname: string;
  role: RoleType;
  isAlive: boolean;
  voteTarget?: string;
  isProtected?: boolean;
  lastAction?: string;
}
```

### Game State Interface
```typescript
interface GameState {
  roomId: string;
  gameId?: string;
  phase: GamePhase;
  dayNumber: number;
  players: PlayerState[];
  winner?: 'mafia' | 'citizen' | 'villain';
  eliminatedPlayers: string[];
  currentVoteTarget?: string;
  voteResults: Record<string, number>;
  nightActions: {
    mafiaTarget?: string;
    policeTarget?: string;
    villainTarget?: string;
  };
  settings: {};
}
```

### DTOs

#### Night Action DTOs
```typescript
// Request DTO
interface NightActionDto {
  userId: string;
  targetUserId: string;
  roomId?: string;
}

// Response DTO
interface NightActionResponseDto {
  success: boolean;
  message: string;
  role: string;
  targetUserId: string;
  allActionsComplete?: boolean;
}

// Police Investigation Response DTO
interface PoliceInvestigationResponseDto {
  success: boolean;
  message: string;
  dayNumber?: number;
  gamePhase?: string;
  investigationResults?: Array<{
    targetUserId: string;
    targetNickname: string;
    targetRole: string;
    isAlive: boolean;
  }> | null;
}
```

#### Vote DTOs
```typescript
// Request DTO
interface VoteDto {
  userId: string;
  targetUserId: string;
}

// Response DTO
interface VoteResponseDto {
  success: boolean;
  message: string;
  voteCount?: number;
  allVotesComplete?: boolean;
}
```

### Database Models

#### User
```json
{
  "userId": "string (UUID)",
  "userEmail": "string (email)",
  "password_hash": "string (hashed)",
  "nickname": "string (max 10 chars)",
  "img_url": "string (optional)",
  "created_at": "Date"
}
```

#### Room
```json
{
  "roomId": "string (UUID)",
  "hostUser": "User (optional)",
  "status": "enum: 'waiting' | 'in_progress' | 'finished'",
  "title": "string (optional)",
  "notes": "string (optional)",
  "requiredPlayers": "number (6-12, default: 8)",
  "created_at": "Date"
}
```

#### Game
```json
{
  "gameId": "string (UUID)",
  "started_at": "Date",
  "ended_at": "Date",
  "winner_team": "enum: 'mafia' | 'citizen' | 'villain'"
}
```

#### GameParticipant
```json
{
  "gameId": "string (UUID)",
  "userId": "string (UUID)",
  "role": "enum: 'mafia' | 'citizen' | 'villain'",
  "isWinner": "boolean"
}
```

---

## Error Handling

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `500 Internal Server Error`: Server error

---

## Game Flow

### Typical Game Progression
1. **Room Creation**: Host creates room with required player count
2. **Player Joining**: Players join room via `/rooms/{roomId}/join`
3. **Auto-Start**: Game starts when required players reached
4. **Role Assignment**: System assigns roles (Mafia, Police, Doctor, Citizen, Villain)
5. **Game Phases**:
   - **Night**: Mafia choose target, Police investigate, Doctor protects
   - **Night Result**: Process night actions, show eliminations
   - **Day**: Discussion phase (police can view investigation results)
   - **Vote**: Players vote to eliminate someone
   - **Day Result**: Process votes, check win conditions
6. **Win Conditions**:
   - **Mafia Wins**: Mafia outnumber or equal citizens
   - **Citizens Win**: All mafia eliminated
   - **Villain Wins**: Villain eliminated by vote

### Night Action Flow
1. **Night Phase Starts**: System initializes empty night actions in Redis
2. **Role Actions**:
   - **Mafia**: Select kill target via `/game-logic/night-action/mafia/{roomId}`
   - **Doctor**: Select protect target via `/game-logic/night-action/doctor/{roomId}`
   - **Police**: Select investigate target via `/game-logic/night-action/police/{roomId}`
3. **Completion Check**: Use `/game-logic/night-action-status/{roomId}` to check if all actions complete
4. **Process Results**: Call `/game-logic/transition-night-result/{roomId}` to process actions
5. **View Results**: Police can view investigation results via `/game-logic/police-investigation-result/{roomId}` during day phase

### Voting Flow
1. **Vote Phase Starts**: System clears previous votes and initializes empty vote tracking
2. **Player Voting**: Each alive player submits vote via `/game-logic/vote/{roomId}`
3. **Vote Tracking**: System prevents duplicate votes and self-voting
4. **Completion Check**: Use `/game-logic/vote-completion/{roomId}` to check remaining voters
5. **Vote Status**: Use `/game-logic/vote-status/{roomId}` to see current vote counts
6. **Process Votes**: Call `/game-logic/transition-day-result/{roomId}` to eliminate player with most votes

### Role Distribution (by player count)
- **8 players**: 2 Mafia, 1 Police, 1 Doctor, 3 Citizens, 1 Villain
- **9 players**: 2 Mafia, 1 Police, 1 Doctor, 4 Citizens, 1 Villain
- **10 players**: 3 Mafia, 1 Police, 1 Doctor, 4 Citizens, 1 Villain
- **11 players**: 3 Mafia, 1 Police, 1 Doctor, 5 Citizens, 1 Villain
- **12 players**: 4 Mafia, 1 Police, 1 Doctor, 6 Citizens, 1 Villain

---

## Redis Data Structures

### Night Actions
```
Key: game:{roomId}:night-actions:{dayNumber}
Type: Hash
Fields:
- mafia_target: "userId"
- doctor_target: "userId"
- police_target: "userId"
- mafia_selected: "true/false"
- doctor_selected: "true/false"
- police_selected: "true/false"
TTL: 1 hour
```

### Police Investigation Results
```
Key: game:{roomId}:investigation:{dayNumber}:{targetUserId}
Type: String
Value: "role"
TTL: 1 hour
```

### Votes
```
Key: game:{roomId}:votes:{dayNumber}
Type: Hash
Fields: {userId: targetUserId}
TTL: 1 hour
```

### Room Participants
```
Key: room:{roomId}:participants
Type: Set
Value: Set of user IDs in the room
TTL: None (persistent until room is deleted)
```

### User Current Room
```
Key: user:{userId}:current_room
Type: String
Value: Room ID where user is currently located
TTL: None (persistent until user leaves room)
```

### Game State Cache
```
Key: game:{roomId}:state
Type: String (JSON)
Value: Game state information
TTL: 1 hour
```

---

## Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=mafia

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Application
PORT=8000
NODE_ENV=development
```

---

## Rate Limiting
Currently, no rate limiting is implemented.

## CORS
CORS is enabled for all origins in development mode.

## Notes
- All endpoints are currently publicly accessible (no JWT authentication)
- Redis is used for real-time participant tracking and game state
- Auto-start functionality triggers when required player count is reached
- Game state is stored in Redis with 1-hour TTL
- Database stores persistent game records and user data
- Night actions are validated for role permissions and game phase
- Police investigation results are only available during day phase or later
- All night actions must be completed before processing night results
- Voting system prevents duplicate votes and self-voting
- Votes are automatically cleared at the start of each vote phase
- All validation errors return proper HTTP status codes with descriptive messages 