# 🧪 Game Logic Testing Guide

This guide provides comprehensive instructions for testing the Mafia game logic in the Scary Mafia Backend.

## 📋 Prerequisites

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Infrastructure
```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d

# Verify services are running
docker ps
```

### 3. Start the Backend
```bash
# Development mode with auto-reload
npm run start:dev

# Or production mode
npm run start:prod
```

## 🧪 Testing Methods

### Method 1: Automated Unit Tests (Recommended)

Run the comprehensive unit tests for the GameLogicService:

```bash
# Run all unit tests
npm test

# Run only game logic tests
npm test -- --testPathPattern=game-logic.service.spec.ts

# Run tests with coverage
npm run test:cov
```

### Method 2: End-to-End Tests

Run the full integration tests that test the complete game flow:

```bash
# Run e2e tests
npm run test:e2e

# Run only game logic e2e tests
npm run test:e2e -- --testPathPattern=game-logic.e2e-spec.ts
```

### Method 3: Manual Testing Script

Use the provided Node.js script for interactive testing:

```bash
# Install axios if not already installed
npm install axios

# Run the test script
node test-game-logic.js
```

### Method 4: Manual API Testing

Use curl commands or Postman to test individual endpoints:

#### Step 1: Create Test Users
```bash
# Create 8 test users
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "player1@test.com",
    "password": "password123",
    "nickname": "player1"
  }'

# Repeat for player2 through player8
```

#### Step 2: Create Room
```bash
curl -X POST http://localhost:8000/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Game Room",
    "notes": "Testing game logic",
    "hostUserId": "USER_ID_FROM_STEP_1",
    "requiredPlayers": 8
  }'
```

#### Step 3: Join Players
```bash
curl -X POST http://localhost:8000/rooms/ROOM_ID/join \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "PLAYER_ID"
  }'
```

#### Step 4: Test Game Logic Flow
```bash
# Get game state
curl -X GET http://localhost:8000/game-logic/state/ROOM_ID

# Start first night
curl -X POST http://localhost:8000/game-logic/start-night/ROOM_ID

# Transition phases
curl -X POST http://localhost:8000/game-logic/transition-night-result/ROOM_ID
curl -X POST http://localhost:8000/game-logic/transition-day/ROOM_ID
curl -X POST http://localhost:8000/game-logic/transition-vote/ROOM_ID
curl -X POST http://localhost:8000/game-logic/transition-day-result/ROOM_ID

# Check win conditions
curl -X GET http://localhost:8000/game-logic/check-win/ROOM_ID

# Get public game state
curl -X GET http://localhost:8000/game-logic/public-state/ROOM_ID \
  -H "Content-Type: application/json" \
  -d '{"userId": "PLAYER_ID"}'
```

## 🎯 Test Scenarios

### 1. Basic Game Flow Test
- ✅ Create 8 players
- ✅ Create room with auto-start
- ✅ Join all players
- ✅ Verify game starts automatically
- ✅ Test all phase transitions
- ✅ Verify win condition checking

### 2. Role Assignment Test
- ✅ Verify roles are assigned correctly
- ✅ Check role distribution (2 mafia, 1 police, 1 doctor, 3 citizens, 1 villain)
- ✅ Verify role visibility in public state

### 3. Win Condition Test
- ✅ Test mafia win (eliminate all citizens)
- ✅ Test citizens win (eliminate all mafia)
- ✅ Test ongoing game (no win condition met)

### 4. Error Handling Test
- ✅ Invalid room ID
- ✅ Non-existent game state
- ✅ Invalid phase transitions
- ✅ Missing required parameters

### 5. State Persistence Test
- ✅ Verify game state persists in Redis
- ✅ Test state retrieval across requests
- ✅ Verify TTL settings

## 🔍 What to Test

### Game Logic Service Methods
- `initializeGame()` - Game initialization
- `getGameState()` - State retrieval
- `startFirstNight()` - First night phase
- `transitionToNight()` - Night phase transitions
- `transitionToDay()` - Day phase transitions
- `transitionToVote()` - Vote phase transitions
- `transitionToDayResult()` - Day result phase
- `checkWinConditions()` - Win condition checking
- `getPublicGameState()` - Public state with role hiding

### Game Phases
- `STARTING` → `NIGHT` → `NIGHT_RESULT` → `DAY` → `VOTE` → `DAY_RESULT`
- Verify phase durations (30s, 60s, 180s)
- Verify day counter increments
- Verify phase end times are set correctly

### Role System
- Role assignment for 8 players
- Role visibility rules (own role visible, others hidden)
- Role-based game logic

### Win Conditions
- Mafia wins when all non-mafia eliminated
- Citizens win when all mafia eliminated
- Game continues when no win condition met

## 🐛 Common Issues & Debugging

### 1. Redis Connection Issues
```bash
# Check Redis status
curl -X GET http://localhost:8000/redis/status

# Test Redis connection
curl -X GET http://localhost:8000/redis/test
```

### 2. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs mafia_postgres
```

### 3. Game State Issues
```bash
# Check if game state exists in Redis
curl -X GET http://localhost:8000/game-logic/state/ROOM_ID

# Verify room participants
curl -X GET http://localhost:8000/rooms/ROOM_ID/participants
```

### 4. Test Data Cleanup
```bash
# Clear Redis data
docker exec mafia_redis redis-cli FLUSHALL

# Reset database (if needed)
docker-compose down
docker-compose up -d
```

## 📊 Expected Test Results

### Successful Test Run Should Show:
```
🚀 Starting Game Logic Tests...

🔍 Testing Redis connection...
   Redis status: Connected
   Message: Redis is connected!

🔧 Creating test users...
✅ Created user: player1 (uuid)
✅ Created user: player2 (uuid)
...

🏠 Creating test room...
✅ Created room: uuid
   Status: waiting
   Required players: 8

👥 Joining players to room...
✅ player1 joined: Successfully joined room
✅ player2 joined: Successfully joined room
...
🎮 Game auto-started! Game started! 8 players joined.

🎮 Testing game logic flow...
1️⃣ Getting initial game state...
   Phase: starting
   Day: 0
   Players: 8

2️⃣ Starting first night...
   Phase: night
   Day: 1
   Duration: 60s

3️⃣ Transitioning to night result...
   Phase: night_result

4️⃣ Transitioning to day...
   Phase: day
   Duration: 180s

5️⃣ Transitioning to vote...
   Phase: vote
   Duration: 60s

6️⃣ Transitioning to day result...
   Phase: day_result

7️⃣ Checking win conditions...
   Game ended: false
   Winner: None

8️⃣ Getting public game state...
   Phase: day_result
   Players: 8
   Player1 role visible: Yes
   Player2 role visible: No

9️⃣ Transitioning to next night...
   Phase: night
   Day: 2

❌ Testing error handling...
✅ Correctly handled invalid room ID
✅ Correctly handled non-existent game state

✅ All tests completed successfully!
```

## 🔧 Custom Test Scenarios

### Test with Different Player Counts
```javascript
// Modify test-game-logic.js to test with 6, 10, or 12 players
const userData = [
  // Add or remove players as needed
];
```

### Test Specific Game Phases
```javascript
// Test only specific phases
await makeRequest('POST', `/game-logic/start-night/${testRoomId}`);
await makeRequest('POST', `/game-logic/transition-night-result/${testRoomId}`);
```

### Test Role Assignment Edge Cases
```javascript
// Test with minimum players (6)
// Test with maximum players (12)
// Test role distribution
```

## 📝 Test Report Template

After running tests, document your findings:

```markdown
## Test Report - [Date]

### Environment
- Backend Version: [version]
- Redis Version: [version]
- PostgreSQL Version: [version]

### Test Results
- ✅ Unit Tests: [X]/[Y] passed
- ✅ E2E Tests: [X]/[Y] passed
- ✅ Manual Tests: [X]/[Y] passed

### Issues Found
- [List any issues discovered]

### Recommendations
- [Suggestions for improvements]
```

## 🚀 Next Steps

After successful testing:

1. **Implement missing features** based on test results
2. **Add WebSocket integration** for real-time updates
3. **Implement complete night action processing**
4. **Add vote collection and processing**
5. **Implement real-time notifications**
6. **Add game state persistence to database**

This testing guide ensures comprehensive validation of the game logic before moving to production. 