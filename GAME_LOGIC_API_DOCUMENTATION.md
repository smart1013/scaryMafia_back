# Game Logic Controller API Documentation

## Overview

**Base URL**: `http://localhost:8000/game-logic`

This document covers all the game logic endpoints for the Scary Mafia game, including game state management, night actions, voting system, and phase transitions.

---

## 1. Start Game

**POST** `/start-game/{roomId}`

Initialize and start a new game for a room.

**Path Parameters**:
- `roomId` (string): The ID of the room to start the game

**Response (200)**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "starting",
  "dayNumber": 0,
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
  "nightActions": {},
  "settings": {}
}
```

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Game already started or room not found",
  "error": "Bad Request"
}
```

---

## 2. Player State

**GET** `/player/state`

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

**Error Response (404)**:
```json
{
  "statusCode": 404,
  "message": "Player not found in game",
  "error": "Not Found"
}
```

---

## 3. Game State

**GET** `/state/{roomId}`

Get the complete game state for a room (admin/development use).

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Response (404)**:
```json
{
  "statusCode": 404,
  "message": "Game state not found",
  "error": "Not Found"
}
```

---

## 4. Transition to Night

**POST** `/transition-night/{roomId}`

Transition game from day to night phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Cannot transition to night phase from current phase",
  "error": "Bad Request"
}
```

---

## 5. Mafia Action

**POST** `/night-action/mafia/{roomId}`

Mafia selects a player to kill during night phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Responses**:

**Wrong Phase (400)**:
```json
{
  "statusCode": 400,
  "message": "Night actions can only be performed during night phase",
  "error": "Bad Request"
}
```

**Invalid Role (400)**:
```json
{
  "statusCode": 400,
  "message": "Player is not a valid mafia or is not alive",
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

---

## 6. Doctor Action

**POST** `/night-action/doctor/{roomId}`

Doctor selects a player to protect during night phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Responses**: Same as Mafia Action (wrong phase, invalid role, target not found)

---

## 7. Police Action

**POST** `/night-action/police/{roomId}`

Police selects a player to investigate during night phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Responses**: Same as Mafia Action (wrong phase, invalid role, target not found)

---

## 8. Night Action

**GET** `/night-actions/{roomId}`

Get all night action selections for the current day (for game master/host).

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Response (404)**:
```json
{
  "statusCode": 404,
  "message": "Game state not found",
  "error": "Not Found"
}
```

---

## 9. Night Action Status

**GET** `/night-action-status/{roomId}`

Check if all required roles have made their night action selections.

**Path Parameters**:
- `roomId` (string): The ID of the room

**Response (200) - Complete**:
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

**Note**: Eliminated roles are automatically marked as "selected" to allow game progression.

---

## 10. Night Result Transition

**POST** `/transition-night-result/{roomId}`

Process night actions and transition to night result phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

**Response (200) - Player Eliminated**:
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
  "settings": {},
  "nightResult": {
    "eliminatedPlayer": {
      "userId": "789e0123-e89b-12d3-a456-426614174000",
      "nickname": "player2",
      "role": "citizen"
    },
    "wasProtected": false,
    "mafiaTarget": "789e0123-e89b-12d3-a456-426614174000",
    "doctorTarget": "abc12345-e89b-12d3-a456-426614174000"
  }
}
```

**Response (200) - Player Protected**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "night_result",
  "dayNumber": 1,
  "players": [...],
  "eliminatedPlayers": [],
  "voteResults": {},
  "nightActions": {
    "mafiaTarget": "789e0123-e89b-12d3-a456-426614174000"
  },
  "settings": {},
  "nightResult": {
    "eliminatedPlayer": undefined,
    "wasProtected": true,
    "mafiaTarget": "789e0123-e89b-12d3-a456-426614174000",
    "doctorTarget": "789e0123-e89b-12d3-a456-426614174000"
  }
}
```

**Response (200) - No Mafia Action**:
```json
{
  "roomId": "456e7890-e89b-12d3-a456-426614174000",
  "phase": "night_result",
  "dayNumber": 1,
  "players": [...],
  "eliminatedPlayers": [],
  "voteResults": {},
  "nightActions": {},
  "settings": {},
  "nightResult": {
    "eliminatedPlayer": undefined,
    "wasProtected": false,
    "mafiaTarget": undefined,
    "doctorTarget": undefined
  }
}
```

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Cannot transition to night result phase from current phase",
  "error": "Bad Request"
}
```

---

## 11. Police Investigation Result

**GET** `/police-investigation-result/{roomId}`

Get police investigation results (available during day phase or later).

**Path Parameters**:
- `roomId` (string): The ID of the room

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

---

## 12. Transition to Day

**POST** `/transition-day/{roomId}`

Transition from night result to day discussion phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Cannot transition to day phase from current phase",
  "error": "Bad Request"
}
```

---

## 13. Transition to Vote

**POST** `/transition-vote/{roomId}`

Transition from day discussion to voting phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Cannot transition to vote phase from current phase",
  "error": "Bad Request"
}
```

---

## 14. Vote

**POST** `/vote/{roomId}`

Submit a vote to eliminate a player during vote phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

---

## 15. Vote Completion

**GET** `/vote-completion/{roomId}`

Check which players still need to vote.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

## 16. Vote Status

**GET** `/vote-status/{roomId}`

Get current vote counts and leading targets.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

---

## 17. Transition to Day Result

**POST** `/transition-day-result/{roomId}`

Process votes and transition to day result phase.

**Path Parameters**:
- `roomId` (string): The ID of the room

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

**Error Response (400)**:
```json
{
  "statusCode": 400,
  "message": "Cannot transition to day result phase from current phase",
  "error": "Bad Request"
}
```

---

## Game Flow Summary

### Typical Game Progression:
1. **Start Game** → Initialize game with role assignments
2. **Transition to Night** → Begin night phase
3. **Night Actions** → Mafia, Doctor, Police make selections
4. **Check Night Action Status** → Verify all actions complete
5. **Transition to Night Result** → Process night actions, show eliminations
6. **Transition to Day** → Begin day discussion phase
7. **Get Police Investigation Results** → Police can view investigation results
8. **Transition to Vote** → Begin voting phase
9. **Submit Votes** → Players vote to eliminate someone
10. **Check Vote Status/Completion** → Monitor voting progress
11. **Transition to Day Result** → Process votes, eliminate player, check win conditions

### Key Features:
- **Automatic Role Handling**: Eliminated roles are automatically marked as "selected" for night actions
- **Phase Validation**: All transitions validate current game phase
- **Duplicate Vote Prevention**: Players cannot vote multiple times
- **Self-Vote Prevention**: Players cannot vote for themselves
- **Real-time Status**: Vote completion and night action status available
- **Investigation Results**: Police can view results during day phase or later

### Error Handling:
- All endpoints return appropriate HTTP status codes
- Descriptive error messages for validation failures
- Game state validation on all operations
- Phase-specific restrictions enforced 