const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test data
let testUsers = {};
let testRoomId = null;

// Helper function to make API calls
async function makeRequest(method, endpoint, data = null) {
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
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      console.error(`Error ${method} ${endpoint}:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`Error ${method} ${endpoint}:`, error.message);
    }
    throw error;
  }
}

// Test functions
async function createTestUsers() {
  console.log('🔧 Creating test users...');
  
  const userData = await makeRequest('GET', '/users/list');
  // console.log(userData);

//   const userData = [
//     { userEmail: 'player1@test.com', password: 'password123', nickname: 'player1' },
//     { userEmail: 'player2@test.com', password: 'password123', nickname: 'player2' },
//     { userEmail: 'player3@test.com', password: 'password123', nickname: 'player3' },
//     { userEmail: 'player4@test.com', password: 'password123', nickname: 'player4' },
//     { userEmail: 'player5@test.com', password: 'password123', nickname: 'player5' },
//     { userEmail: 'player6@test.com', password: 'password123', nickname: 'player6' },
//     { userEmail: 'player7@test.com', password: 'password123', nickname: 'player7' },
//     { userEmail: 'player8@test.com', password: 'password123', nickname: 'player8' },
//   ];

  for (const user of userData) {
    // console.log(`Creating user: ${user.nickname} with email: ${user.userEmail}`);
    testUsers[user.nickname] = user;
    console.log(`✅ Created user: ${user.nickname} (${user.userId})`);
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
    title: 'Test Game Room',
    notes: 'Testing game logic flow',
    hostUserId: testUsers.player1.userId,
    requiredPlayers: 8
  };

  const response = await makeRequest('POST', '/rooms', roomData);
  testRoomId = response.roomId;
  console.log(`✅ Created room: ${testRoomId}`);
  console.log(`   Status: ${response.status}`);
  console.log(`   Required players: ${response.requiredPlayers}`);
}

async function joinPlayersToRoom() {
  console.log('\n👥 Joining players to room...');
  
  const players = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
  
  for (const playerNickname of players) {
    const joinData = {
      userId: testUsers[playerNickname].userId
    };
    
    const response = await makeRequest('POST', `/rooms/${testRoomId}/join`, joinData);
    console.log(`✅ ${playerNickname} joined: ${response.message}`);
    
    if (response.gameStarted) {
      console.log(`🎮 Game auto-started! ${response.waitingMessage}`);
    }
  }

  // Check room participants
  const participants = await makeRequest('GET', `/rooms/${testRoomId}/participants`);
  console.log(`\n📊 Room participants: ${participants.count}/${participants.requiredPlayers}`);
  console.log(`   Can start game: ${participants.canStartGame}`);
}

async function testGameLogicFlow() {
  console.log('\n🎮 Testing game logic flow...');

  // Start game
  console.log('\n0️⃣ Starting game...');
  const startGame = await makeRequest('POST', `/rooms/${testRoomId}/start-game`);
  console.log(`   Game started: ${startGame.message}`);

  // Get initial game state
  console.log('\n1️⃣ Getting initial game state...');
  const initialState = await makeRequest('GET', `/game-logic/state/${testRoomId}`);
  console.log(`   Phase: ${initialState.phase}`);
  console.log(`   Day: ${initialState.dayNumber}`);
  console.log(`   Players: ${initialState.players.length}`);

  // Start first night
  console.log('\n2️⃣ Starting first night...');
  const nightState = await makeRequest('POST', `/game-logic/start-night/${testRoomId}`);
  console.log(`   Phase: ${nightState.phase}`);
  console.log(`   Day: ${nightState.dayNumber}`);
  console.log(`   Duration: ${nightState.phaseDuration}s`);

  // Transition to night result
  console.log('\n3️⃣ Transitioning to night result...');
  const nightResultState = await makeRequest('POST', `/game-logic/transition-night-result/${testRoomId}`);
  console.log(`   Phase: ${nightResultState.phase}`);

  // Transition to day
  console.log('\n4️⃣ Transitioning to day...');
  const dayState = await makeRequest('POST', `/game-logic/transition-day/${testRoomId}`);
  console.log(`   Phase: ${dayState.phase}`);
  console.log(`   Duration: ${dayState.phaseDuration}s`);

  // Transition to vote
  console.log('\n5️⃣ Transitioning to vote...');
  const voteState = await makeRequest('POST', `/game-logic/transition-vote/${testRoomId}`);
  console.log(`   Phase: ${voteState.phase}`);
  console.log(`   Duration: ${voteState.phaseDuration}s`);

  // Transition to day result
  console.log('\n6️⃣ Transitioning to day result...');
  const dayResultState = await makeRequest('POST', `/game-logic/transition-day-result/${testRoomId}`);
  console.log(`   Phase: ${dayResultState.phase}`);

  // Check win conditions
  console.log('\n7️⃣ Checking win conditions...');
  const winCheck = await makeRequest('GET', `/game-logic/check-win/${testRoomId}`);
  console.log(`   Game ended: ${winCheck.gameEnded}`);
  console.log(`   Winner: ${winCheck.winner || 'None'}`);

  // Get public game state
  console.log('\n8️⃣ Getting public game state...');
  const publicState = await makeRequest('GET', `/game-logic/public-state/${testRoomId}`, {
    userId: testUsers.player1.userId
  });
  console.log(`   Phase: ${publicState.phase}`);
  console.log(`   Players: ${publicState.players.length}`);
  
  // Check role visibility
  const player1 = publicState.players.find(p => p.userId === testUsers.player1.userId);
  const player2 = publicState.players.find(p => p.userId === testUsers.player2.userId);
  console.log(`   Player1 role visible: ${player1.role ? 'Yes' : 'No'}`);
  console.log(`   Player2 role visible: ${player2.role ? 'Yes' : 'No'}`);

  // Transition to next night
  console.log('\n9️⃣ Transitioning to next night...');
  const nextNightState = await makeRequest('POST', `/game-logic/transition-night/${testRoomId}`);
  console.log(`   Phase: ${nextNightState.phase}`);
  console.log(`   Day: ${nextNightState.dayNumber}`);
}

async function testErrorHandling() {
  console.log('\n❌ Testing error handling...');

  try {
    await makeRequest('GET', '/game-logic/state/invalid-room-id');
  } catch (error) {
    console.log('✅ Correctly handled invalid room ID');
  }

  try {
    await makeRequest('POST', '/game-logic/start-night/00000000-0000-0000-0000-000000000000');
  } catch (error) {
    console.log('✅ Correctly handled non-existent game state');
  }
}

async function testRedisConnection() {
  console.log('\n🔍 Testing Redis connection...');
  
  try {
    const response = await makeRequest('GET', '/redis/test');
    console.log(`   Redis status: ${response.success ? 'Connected' : 'Disconnected'}`);
    console.log(`   Message: ${response.message}`);
  } catch (error) {
    console.log('❌ Redis test failed');
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Game Logic Tests...\n');

  try {
    await testRedisConnection();
    await createTestUsers();
    await leaveAllCurrentRooms();
    await createTestRoom();
    await joinPlayersToRoom();
    await testGameLogicFlow();
    await testErrorHandling();

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  createTestUsers,
  leaveAllCurrentRooms,
  createTestRoom,
  joinPlayersToRoom,
  testGameLogicFlow,
  testErrorHandling,
  testRedisConnection
}; 