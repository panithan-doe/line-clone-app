import { check, sleep } from 'k6';
import { TestUserPool, makeGraphQLRequest } from './auth-helper.js';
import { CONFIG, GRAPHQL_OPERATIONS } from './config.js';

// Test configuration for creating private chats
export const options = {
  stages: [
    { duration: '1m', target: 30 },    // Ramp up to 30 users over 1 minute
    { duration: '2m', target: 100 },   // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },   // Stay at 100 users for 5 minutes
    { duration: '1m', target: 0 },     // Ramp down to 0 users over 1 minute
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests must complete within 5s
    http_req_failed: ['rate<0.10'],    // Error rate must be less than 10%
    checks: ['rate>0.90'],             // 90% of checks must pass
  }
};

// Shared test user pool
const userPool = new TestUserPool();

export default async function() {
  let currentUser, targetUser;
  
  try {
    // Get two different authenticated users for private chat creation
    const users = await userPool.getMultipleUsers(2);
    currentUser = users[0];
    targetUser = users[1];
    
    // Skip if we couldn't get two different users
    if (!currentUser || !targetUser || currentUser.email === targetUser.email) {
      console.log('Skipping: Unable to get two different users for private chat');
      return;
    }
    
    // Prepare variables for private chat creation
    const variables = {
      currentUserId: currentUser.email,
      targetUserId: targetUser.email,
      currentUserNickname: currentUser.nickname,
      targetUserNickname: targetUser.nickname
    };
    
    // Create private chat
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.CREATE_PRIVATE_CHAT,
      variables,
      currentUser.headers
    );
    
    // Validate response
    const success = check(response, {
      'private chat created successfully': (r) => r.status === 200,
      'response has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.createPrivateChat;
        } catch (e) {
          return false;
        }
      },
      'chat room ID returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data.createPrivateChat && body.data.createPrivateChat.id;
        } catch (e) {
          return false;
        }
      },
      'chat type is private': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data.createPrivateChat && body.data.createPrivateChat.type === 'private';
        } catch (e) {
          return false;
        }
      },
      'response time acceptable': (r) => r.timings.duration < 4000,
      'no GraphQL errors': (r) => {
        try {
          const body = JSON.parse(r.body);
          return !body.errors || body.errors.length === 0;
        } catch (e) {
          return false;
        }
      }
    });
    
    if (!success) {
      console.error(`Private chat creation failed for users ${currentUser.email} -> ${targetUser.email}:`, response.body);
    } else {
      // Log successful chat creation
      const body = JSON.parse(response.body);
      const chatRoom = body.data.createPrivateChat;
      console.log(`✓ Private chat created: ${chatRoom.id} between ${currentUser.nickname} and ${targetUser.nickname}`);
    }
    
    // Realistic pause between private chat creations (3-8 seconds)
    // Creating private chats is typically less frequent than sending messages
    sleep(Math.random() * 5 + 3);
    
  } catch (error) {
    console.error('Private chat test execution error:', error);
    check(null, { 'test execution successful': () => false });
  }
}

// Setup function to initialize test data
export function setup() {
  console.log('Starting create private chat load test...');
  console.log(`Target: ${CONFIG.APPSYNC_URL}`);
  console.log(`Test Users: ${CONFIG.TEST_USERS.USERS.length}`);
  
  // Check if we have enough users for private chat testing
  if (CONFIG.TEST_USERS.USERS.length < 2) {
    throw new Error('Need at least 2 test users for private chat creation testing');
  }
  
  return {
    startTime: new Date().toISOString(),
    totalUsers: CONFIG.TEST_USERS.USERS.length
  };
}

// Teardown function to clean up after test
export function teardown(data) {
  console.log('Create private chat load test completed.');
  console.log(`Test duration: ${new Date().toISOString()} - ${data.startTime}`);
  console.log(`Total test users available: ${data.totalUsers}`);
}