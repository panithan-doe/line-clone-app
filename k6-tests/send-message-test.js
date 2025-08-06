import { check, sleep } from 'k6';
import { TestUserPool, makeGraphQLRequest } from './auth-helper.js';
import { CONFIG, GRAPHQL_OPERATIONS } from './config.js';

// Test configuration for sending messages
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Ramp up to 50 users over 30 seconds
    { duration: '2m', target: 200 },   // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 },   // Stay at 200 users for 5 minutes
    { duration: '30s', target: 0 },    // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete within 3s
    http_req_failed: ['rate<0.05'],    // Error rate must be less than 5%
    checks: ['rate>0.95'],             // 95% of checks must pass
  }
};

// Shared test user pool
const userPool = new TestUserPool();

// Sample chat room IDs - in real scenario, these would be fetched dynamically
const SAMPLE_CHAT_ROOMS = [
  'test-chatroom-1',
  'test-chatroom-2', 
  'test-chatroom-3',
  'test-chatroom-4',
  'test-chatroom-5'
];

// Message content variations for realistic testing
const MESSAGE_TEMPLATES = [
  'Hello everyone! How are you doing today?',
  'Check out this awesome feature we just shipped! 🚀',
  'Does anyone know how to solve this issue?',
  'Thanks for your help with the project!',
  'Let\'s schedule a meeting for next week.',
  'Great work on the presentation today!',
  'Can someone review this document?',
  'Happy Friday everyone! 🎉',
  'Looking forward to the weekend plans.',
  'Just finished the latest updates.',
  'This is a longer message to test how the system handles various message lengths. Sometimes users send detailed explanations or share comprehensive updates that span multiple sentences.',
  '👍', '❤️', '😂', '🔥', // Emoji reactions
  'Quick update on the project status.',
  'Meeting notes from today\'s discussion.',
];

export default async function() {
  let user;
  
  try {
    // Get authenticated user
    user = await userPool.getAuthenticatedUser();
    
    // Select random chat room
    const chatRoomId = SAMPLE_CHAT_ROOMS[Math.floor(Math.random() * SAMPLE_CHAT_ROOMS.length)];
    
    // Select random message content
    const messageContent = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
    
    // Prepare message variables
    const variables = {
      chatRoomId: chatRoomId,
      content: messageContent,
      senderId: user.email,
      senderNickname: user.nickname,
      type: 'text'
    };
    
    // Send message
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.SEND_MESSAGE,
      variables,
      user.headers
    );
    
    // Validate response
    const success = check(response, {
      'message sent successfully': (r) => r.status === 200,
      'response has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.sendMessage;
        } catch (e) {
          return false;
        }
      },
      'message ID returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data.sendMessage && body.data.sendMessage.id;
        } catch (e) {
          return false;
        }
      },
      'response time acceptable': (r) => r.timings.duration < 2000,
    });
    
    if (!success) {
      console.error(`Message send failed for user ${user.email}:`, response.body);
    }
    
    // Realistic pause between messages (1-5 seconds)
    sleep(Math.random() * 4 + 1);
    
  } catch (error) {
    console.error('Test execution error:', error);
    check(null, { 'test execution successful': () => false });
  }
}

// Setup function to initialize test data
export function setup() {
  console.log('Starting send message load test...');
  console.log(`Target: ${CONFIG.APPSYNC_URL}`);
  console.log(`Test Users: ${CONFIG.TEST_USERS.USERS.length}`);
  console.log(`Sample Chat Rooms: ${SAMPLE_CHAT_ROOMS.length}`);
  
  return {
    startTime: new Date().toISOString()
  };
}

// Teardown function to clean up after test
export function teardown(data) {
  console.log('Send message load test completed.');
  console.log(`Test duration: ${new Date().toISOString()} - ${data.startTime}`);
}