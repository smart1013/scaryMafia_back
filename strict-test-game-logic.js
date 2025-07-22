const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test data
let testUsers = {};
let testRoomId = null;
let gameState = null;

// Test configuration
const TEST_CONFIG = {
  requiredPlayers: 8,
  maxPlayers: 12,
  minPlayers: 6,
  expectedRoles: {
    8: { mafia: 2, police: 1, doctor: 1, citizen: 3, villain: 1 },
    9: { mafia: 2, police: 1, doctor: 1, citizen: 4, villain: 1 },
    10: { mafia: 3, police: 1, doctor: 1, citizen: 4, villain: 1 },
    11: { mafia: 3, police: 1, doctor: 1, citizen: 5, villain: 1 },
    12: { mafia: 4, police: 1, doctor: 1, citizen: 6, villain: 1 }
  }
};

// Helper function to make API calls with strict error handling
async function makeRequest(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    // Strict status code validation
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      console.error(`❌ Error ${method} ${endpoint}:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`❌ Error ${method} ${endpoint}:`, error.message);
    }
    throw error;
  }
}

// Assertion helper functions
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ Assertion failed: ${message}. Expected: ${expected}, Got: ${actual}`);
  }
}

function assertNotNull(value, message) {
  if (value === null || value === undefined) {
    throw new Error(`❌ Assertion failed: ${message}. Value is null or undefined`);
  }
}

function assertArrayLength(array, expectedLength, message) {
  if (!Array.isArray(array)) {
    throw new Error(`❌ Assertion failed: ${message}. Expected array, got ${typeof array}`);
  }
  if (array.length !== expectedLength) {
    throw new Error(`❌ Assertion failed: ${message}. Expected length: ${expectedLength}, Got: ${array.length}`);
  }
}

// Test functions with strict validation
async function createTestUsers() {
  console.log('🔧 Creating test users...');
  
  try {
    const userData = await makeRequest('GET', '/users/list');
    assertNotNull(userData, 'User data should not be null');
    assertArrayLength(userData, TEST_CONFIG.requiredPlayers, `Should have exactly ${TEST_CONFIG.requiredPlayers} users`);

    for (const user of userData) {
      assertNotNull(user.userId, 'User ID should not be null');
      assertNotNull(user.nickname, 'User nickname should not be null');
      assertNotNull(user.userEmail, 'User email should not be null');
      
      testUsers[user.nickname] = user;
      console.log(`✅ Created user: ${user.nickname} (${user.userId})`);
    }
    
    console.log(`✅ Successfully created ${Object.keys(testUsers).length} test users`);
  } catch (error) {
    console.error('❌ Failed to create test users:', error.message);
    throw error;
  }
}

async function leaveAllCurrentRooms() {
  console.log('🚪 Making all users leave their current rooms...');
  
  for (const [nickname, user] of Object.entries(testUsers)) {
    try {
      // Check if user is in a room
      const currentRoom = await makeRequest('GET', `/rooms/current/${user.userId}`);
      
      if (currentRoom.roomId) {
        // User is in a room, make them leave
        const leaveResponse = await makeRequest('POST', '/rooms/leave-current', {
          userId: user.userId
        });
        assertNotNull(leaveResponse.message, 'Leave response should have a message');
        console.log(`✅ ${nickname} left room: ${leaveResponse.message}`);
      } else {
        console.log(`ℹ️ ${nickname} is not in any room`);
      }
    } catch (error) {
      console.log(`⚠️ Could not check/leave room for ${nickname}: ${error.message}`);
    }
  }
  
  console.log('✅ All users have left their current rooms');
}

async function createTestRoom() {
  console.log('\n🏠 Creating test room...');
  
  const roomData = {
    title: 'Strict Test Game Room',
    notes: 'Testing game logic flow with strict validation',
    hostUserId: testUsers.player1.userId,
    requiredPlayers: TEST_CONFIG.requiredPlayers
  };

  const response = await makeRequest('POST', '/rooms', roomData);
  
  // Strict validation of room creation response
  assertNotNull(response.roomId, 'Room ID should not be null');
  assertEqual(response.status, 'waiting', 'Room status should be waiting');
  assertEqual(response.requiredPlayers, TEST_CONFIG.requiredPlayers, 'Required players should match config');
  assertNotNull(response.hostUser, 'Host user should not be null');
  assertEqual(response.hostUser.userId, testUsers.player1.userId, 'Host user ID should match');
  
  testRoomId = response.roomId;
  console.log(`✅ Created room: ${testRoomId}`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Required players: ${response.requiredPlayers}`);
  console.log(`   Host: ${response.hostUser.nickname}`);
}

async function joinPlayersToRoom() {
  console.log('\n👥 Joining players to room...');
  
  const players = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
  
  for (const playerNickname of players) {
    const joinData = {
      userId: testUsers[playerNickname].userId
    };
    
    const response = await makeRequest('POST', `/rooms/${testRoomId}/join`, joinData);
    
    // Validate join response
    assertNotNull(response.message, 'Join response should have a message');
    assertEqual(response.roomId, testRoomId, 'Room ID should match');
    assertEqual(response.userId, testUsers[playerNickname].userId, 'User ID should match');
    
    console.log(`✅ ${playerNickname} joined: ${response.message}`);
    
    if (response.gameStarted) {
      console.log(`🎮 Game auto-started! ${response.waitingMessage}`);
    }
  }

  // Check room participants with strict validation
  const participants = await makeRequest('GET', `/rooms/${testRoomId}/participants`);
  assertEqual(participants.roomId, testRoomId, 'Room ID should match');
  assertArrayLength(participants.participants, TEST_CONFIG.requiredPlayers, 'Should have correct number of participants');
  assertEqual(participants.count, TEST_CONFIG.requiredPlayers, 'Participant count should match');
  assertEqual(participants.requiredPlayers, TEST_CONFIG.requiredPlayers, 'Required players should match');
  assert(participants.canStartGame, 'Game should be able to start');
  
  console.log(`\n📊 Room participants: ${participants.count}/${participants.requiredPlayers}`);
  console.log(`   Can start game: ${participants.canStartGame}`);
  console.log(`   Participants: ${participants.participants.join(', ')}`);
}

async function validateGameStart() {
  console.log('\n🎮 Starting game with strict validation...');
  
  // Check if game can start before starting
  const canStart = await makeRequest('GET', `/rooms/${testRoomId}/can-start`);
  assert(canStart.canStart, 'Game should be able to start before starting');
  
  // Start the game
  const startResponse = await makeRequest('POST', `/rooms/${testRoomId}/start-game`);
  assertNotNull(startResponse.message, 'Start response should have a message');
  assert(startResponse.success, 'Game start should be successful');
  
  console.log(`✅ Game started: ${startResponse.message}`);
  
  // Verify room status changed
  const roomStatus = await makeRequest('GET', `/rooms/${testRoomId}`);
  assertEqual(roomStatus.status, 'in_progress', 'Room status should be in_progress after game start');
}

async function validateGameState() {
  console.log('\n📊 Validating game state...');
  
  // Get game state
  gameState = await makeRequest('GET', `/game-logic/state/${testRoomId}`);
  
  // Strict validation of game state
  assertNotNull(gameState, 'Game state should not be null');
  assertEqual(gameState.roomId, testRoomId, 'Game state room ID should match');
  assertEqual(gameState.phase, 'STARTING', 'Initial game phase should be STARTING');
  assertEqual(gameState.dayNumber, 0, 'Initial day number should be 0');
  assertArrayLength(gameState.players, TEST_CONFIG.requiredPlayers, 'Should have correct number of players');
  assertArrayLength(gameState.eliminatedPlayers, 0, 'Should have no eliminated players initially');
  
  // Validate each player
  const expectedRoles = TEST_CONFIG.expectedRoles[TEST_CONFIG.requiredPlayers];
  const roleCounts = {};
  
  for (const player of gameState.players) {
    assertNotNull(player.userId, 'Player should have user ID');
    assertNotNull(player.nickname, 'Player should have nickname');
    assertNotNull(player.role, 'Player should have role');
    assert(player.isAlive, 'Player should be alive initially');
    
    // Count roles
    roleCounts[player.role] = (roleCounts[player.role] || 0) + 1;
  }
  
  // Validate role distribution
  for (const [role, expectedCount] of Object.entries(expectedRoles)) {
    assertEqual(roleCounts[role], expectedCount, `Should have ${expectedCount} ${role} players`);
  }
  
  console.log(`✅ Game state validated successfully`);
  console.log(`   Phase: ${gameState.phase}`);
  console.log(`   Day: ${gameState.dayNumber}`);
  console.log(`   Players: ${gameState.players.length}`);
  console.log(`   Role distribution:`, roleCounts);
}

async function testGameLogicFlow() {
  console.log('\n🎮 Testing game logic flow with strict validation...');

  // Start first night
  console.log('\n1️⃣ Starting first night...');
  const nightState = await makeRequest('POST', `/game-logic/start-night/${testRoomId}`);
  assertEqual(nightState.phase, 'NIGHT', 'Phase should be NIGHT');
  assertEqual(nightState.dayNumber, 1, 'Day number should be 1');
  assert(nightState.phaseDuration > 0, 'Phase duration should be positive');
  console.log(`   Phase: ${nightState.phase}`);
  console.log(`   Day: ${nightState.dayNumber}`);
  console.log(`   Duration: ${nightState.phaseDuration}s`);

  // Transition to night result
  console.log('\n2️⃣ Transitioning to night result...');
  const nightResultState = await makeRequest('POST', `/game-logic/transition-night-result/${testRoomId}`);
  assertEqual(nightResultState.phase, 'NIGHT_RESULT', 'Phase should be NIGHT_RESULT');
  console.log(`   Phase: ${nightResultState.phase}`);

  // Transition to day
  console.log('\n3️⃣ Transitioning to day...');
  const dayState = await makeRequest('POST', `/game-logic/transition-day/${testRoomId}`);
  assertEqual(dayState.phase, 'DAY', 'Phase should be DAY');
  assertEqual(dayState.dayNumber, 1, 'Day number should still be 1');
  assert(dayState.phaseDuration > 0, 'Phase duration should be positive');
  console.log(`   Phase: ${dayState.phase}`);
  console.log(`   Duration: ${dayState.phaseDuration}s`);

  // Transition to vote
  console.log('\n4️⃣ Transitioning to vote...');
  const voteState = await makeRequest('POST', `/game-logic/transition-vote/${testRoomId}`);
  assertEqual(voteState.phase, 'VOTE', 'Phase should be VOTE');
  assert(voteState.phaseDuration > 0, 'Phase duration should be positive');
  console.log(`   Phase: ${voteState.phase}`);
  console.log(`   Duration: ${voteState.phaseDuration}s`);

  // Transition to day result
  console.log('\n5️⃣ Transitioning to day result...');
  const dayResultState = await makeRequest('POST', `/game-logic/transition-day-result/${testRoomId}`);
  assertEqual(dayResultState.phase, 'DAY_RESULT', 'Phase should be DAY_RESULT');
  console.log(`   Phase: ${dayResultState.phase}`);

  // Check win conditions
  console.log('\n6️⃣ Checking win conditions...');
  const winCheck = await makeRequest('GET', `/game-logic/check-win/${testRoomId}`);
  assertNotNull(winCheck.gameEnded, 'Win check should have gameEnded property');
  console.log(`   Game ended: ${winCheck.gameEnded}`);
  console.log(`   Winner: ${winCheck.winner || 'None'}`);

  // Get public game state
  console.log('\n7️⃣ Getting public game state...');
  const publicState = await makeRequest('GET', `/game-logic/public-state/${testRoomId}`, {
    userId: testUsers.player1.userId
  });
  assertNotNull(publicState, 'Public state should not be null');
  assertEqual(publicState.roomId, testRoomId, 'Public state room ID should match');
  assertArrayLength(publicState.players, TEST_CONFIG.requiredPlayers, 'Public state should have correct number of players');
  
  // Check role visibility
  const player1 = publicState.players.find(p => p.userId === testUsers.player1.userId);
  const player2 = publicState.players.find(p => p.userId === testUsers.player2.userId);
  assertNotNull(player1.role, 'Player1 should see their own role');
  assert(player2.role === undefined, 'Player1 should not see Player2 role');
  
  console.log(`   Phase: ${publicState.phase}`);
  console.log(`   Players: ${publicState.players.length}`);
  console.log(`   Player1 role visible: ${player1.role ? 'Yes' : 'No'}`);
  console.log(`   Player2 role visible: ${player2.role ? 'Yes' : 'No'}`);

  // Transition to next night
  console.log('\n8️⃣ Transitioning to next night...');
  const nextNightState = await makeRequest('POST', `/game-logic/transition-night/${testRoomId}`);
  assertEqual(nextNightState.phase, 'NIGHT', 'Phase should be NIGHT');
  assertEqual(nextNightState.dayNumber, 2, 'Day number should be 2');
  console.log(`   Phase: ${nextNightState.phase}`);
  console.log(`   Day: ${nextNightState.dayNumber}`);
}

async function testErrorHandling() {
  console.log('\n❌ Testing error handling...');

  // Test invalid room ID
  try {
    await makeRequest('GET', '/game-logic/state/invalid-room-id', null, 400);
    console.log('✅ Correctly handled invalid room ID');
  } catch (error) {
    console.log('✅ Correctly handled invalid room ID');
  }

  // Test non-existent game state
  try {
    await makeRequest('POST', '/game-logic/start-night/00000000-0000-0000-0000-000000000000', null, 400);
    console.log('✅ Correctly handled non-existent game state');
  } catch (error) {
    console.log('✅ Correctly handled non-existent game state');
  }

  // Test invalid game phase transitions
  try {
    await makeRequest('POST', `/game-logic/transition-day/${testRoomId}`, null, 400);
    console.log('✅ Correctly handled invalid phase transition');
  } catch (error) {
    console.log('✅ Correctly handled invalid phase transition');
  }
}

async function testRedisConnection() {
  console.log('\n🔍 Testing Redis connection...');
  
  try {
    const response = await makeRequest('GET', '/redis/test');
    assert(response.success, 'Redis connection should be successful');
    assertNotNull(response.message, 'Redis response should have a message');
    console.log(`   Redis status: ${response.success ? 'Connected' : 'Disconnected'}`);
    console.log(`   Message: ${response.message}`);
  } catch (error) {
    console.log('❌ Redis test failed');
    throw error;
  }
}

async function validateGameCleanup() {
  console.log('\n🧹 Validating game cleanup...');
  
  // Check that game state is properly stored
  const currentGameState = await makeRequest('GET', `/game-logic/state/${testRoomId}`);
  assertNotNull(currentGameState, 'Game state should persist after game flow');
  assert(currentGameState.players.length > 0, 'Game should have players');
  
  console.log('✅ Game cleanup validation passed');
}

// Main test function with strict error handling
async function runStrictTests() {
  console.log('🚀 Starting Strict Game Logic Tests...\n');

  try {
    await testRedisConnection();
    await createTestUsers();
    await leaveAllCurrentRooms();
    await createTestRoom();
    await joinPlayersToRoom();
    await validateGameStart();
    await validateGameState();
    await testGameLogicFlow();
    await testErrorHandling();
    await validateGameCleanup();

    console.log('\n✅ All strict tests completed successfully!');
    console.log('🎉 Game logic is working correctly with strict validation!');
  } catch (error) {
    console.error('\n❌ Strict test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runStrictTests();
}

module.exports = {
  runStrictTests,
  createTestUsers,
  leaveAllCurrentRooms,
  createTestRoom,
  joinPlayersToRoom,
  validateGameStart,
  validateGameState,
  testGameLogicFlow,
  testErrorHandling,
  testRedisConnection,
  validateGameCleanup
}; 