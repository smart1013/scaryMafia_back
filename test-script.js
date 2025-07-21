const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

// Test data
let testUserId1 = '';
let testUserId2 = '';
let testRoomId = '';

async function testAPI() {
  console.log('🧪 Starting Mafia Backend API Tests...\n');

  try {
    // Test 1: Redis Connection
    console.log('1️⃣ Testing Redis Connection...');
    const redisTest = await axios.get(`${BASE_URL}/redis/test`);
    console.log('✅ Redis:', redisTest.data.message);

    // Test 2: Register Users
    console.log('\n2️⃣ Testing User Registration...');
    
    const user1 = await axios.post(`${BASE_URL}/auth/signup`, {
      userEmail: 'test1@example.com',
      password: 'password123',
      nickname: 'testplayer1'
    });
    testUserId1 = user1.data.userId;
    console.log('✅ User 1 registered:', user1.data.nickname);

    const user2 = await axios.post(`${BASE_URL}/auth/signup`, {
      userEmail: 'test2@example.com',
      password: 'password123',
      nickname: 'testplayer2'
    });
    testUserId2 = user2.data.userId;
    console.log('✅ User 2 registered:', user2.data.nickname);

    // Test 3: Login
    console.log('\n3️⃣ Testing User Login...');
    const login1 = await axios.post(`${BASE_URL}/auth/login`, {
      userEmail: 'test1@example.com',
      password: 'password123'
    });
    console.log('✅ User 1 logged in:', login1.data.nickname);

    // Test 4: Create Room
    console.log('\n4️⃣ Testing Room Creation...');
    const room = await axios.post(`${BASE_URL}/rooms`, {
      title: 'Test Mafia Game',
      notes: 'Testing room creation',
      hostUserId: testUserId1,
      requiredPlayers: 8
    });
    testRoomId = room.data.roomId;
    console.log('✅ Room created:', room.data.title);

    // Test 5: Join Room
    console.log('\n5️⃣ Testing Room Joining...');
    const join = await axios.post(`${BASE_URL}/rooms/${testRoomId}/join`, {
      userId: testUserId2
    });
    console.log('✅ User 2 joined room:', join.data.message);

    // Test 6: Get Room Participants
    console.log('\n6️⃣ Testing Room Participants...');
    const participants = await axios.get(`${BASE_URL}/rooms/${testRoomId}/participants`);
    console.log('✅ Participants:', participants.data.count, 'players');

    // Test 7: Check Game Start Status
    console.log('\n7️⃣ Testing Game Start Check...');
    const canStart = await axios.get(`${BASE_URL}/rooms/${testRoomId}/can-start`);
    console.log('✅ Can start game:', canStart.data.canStart, canStart.data.reason || '');

    // Test 8: Get Game State (should be null initially)
    console.log('\n8️⃣ Testing Game State...');
    try {
      const gameState = await axios.get(`${BASE_URL}/game-logic/state/${testRoomId}`);
      console.log('✅ Game state retrieved');
    } catch (error) {
      console.log('ℹ️ No game state yet (expected)');
    }

    // Test 9: Get User Count
    console.log('\n9️⃣ Testing User Management...');
    const userCount = await axios.get(`${BASE_URL}/users/count`);
    console.log('✅ Total users:', userCount.data);

    // Test 10: Get All Users
    const allUsers = await axios.get(`${BASE_URL}/users/list`);
    console.log('✅ Users list retrieved:', allUsers.data.length, 'users');

    console.log('\n🎉 All basic tests passed!');
    console.log('\n📊 Test Summary:');
    console.log(`- Users created: ${allUsers.data.length}`);
    console.log(`- Room created: ${testRoomId}`);
    console.log(`- Participants: ${participants.data.count}`);
    console.log(`- Can start game: ${canStart.data.canStart}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Run the tests
testAPI(); 