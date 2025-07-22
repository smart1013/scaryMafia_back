const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testSignupSimple() {
  try {
    console.log('Testing simple signup...');
    
    const userData = {
      userEmail: 'test@test.com',
      password: 'password123',
      nickname: 'testuser'
    };

    console.log('Sending data:', JSON.stringify(userData, null, 2));

    const response = await axios.post(`${BASE_URL}/auth/signup`, userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error details:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 500) {
      console.error('\nThis is a server error. Check the backend logs for more details.');
      console.error('Possible causes:');
      console.error('1. Database connection issue');
      console.error('2. Circular dependency in modules');
      console.error('3. Missing database table');
      console.error('4. TypeORM configuration issue');
    }
  }
}

testSignupSimple(); 