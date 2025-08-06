import { check, sleep } from 'k6';
import { TestUserPool, makeGraphQLRequest } from './auth-helper.js';
import { CONFIG, GRAPHQL_OPERATIONS } from './config.js';

// Test configuration for creating group chats
export const options = {
  stages: [
    { duration: '1m', target: 20 },    // Ramp up to 20 users over 1 minute
    { duration: '2m', target: 50 },    // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },    // Stay at 50 users for 5 minutes
    { duration: '1m', target: 0 },     // Ramp down to 0 users over 1 minute
  ],
  thresholds: {
    http_req_duration: ['p(95)<8000'], // 95% of requests must complete within 8s
    http_req_failed: ['rate<0.15'],    // Error rate must be less than 15%
    checks: ['rate>0.85'],             // 85% of checks must pass
  }
};

// Shared test user pool
const userPool = new TestUserPool();

// Group chat name templates for realistic testing
const GROUP_NAME_TEMPLATES = [
  'Project Team Alpha',
  'Weekend Plans Discussion',
  'Tech Talk Group',
  'Book Club Meeting',
  'Gaming Squad',
  'Study Group',
  'Work Updates',
  'Family Chat',
  'Travel Planning',
  'Recipe Sharing',
  'Daily Standup',
  'Marketing Team',
  'Design Reviews',
  'Coffee Break Chat',
  'Sports Discussion'
];

// Group description templates
const GROUP_DESCRIPTION_TEMPLATES = [
  'Let\'s collaborate and share updates on our ongoing project.',
  'Planning our weekend activities and coordinating meetups.',
  'Discussing the latest technology trends and innovations.',
  'Monthly book discussions and reading recommendations.',
  'Coordinating gaming sessions and tournaments.',
  'Study group for exam preparation and knowledge sharing.',
  'Regular work updates and team coordination.',
  'Staying connected with family and sharing moments.',
  'Planning our upcoming trips and adventures.',
  'Sharing delicious recipes and cooking tips.',
  'Daily team standup and progress updates.',
  'Marketing campaign discussions and strategy.',
  'Design review sessions and creative feedback.',
  'Casual conversations during coffee breaks.',
  'Sports news, scores, and team discussions.'
];

export default async function() {
  let creator, members;
  
  try {
    // Get 3-5 users for group chat creation (1 creator + 2-4 members)
    const groupSize = Math.floor(Math.random() * 3) + 3; // 3-5 users
    const users = await userPool.getMultipleUsers(groupSize);
    
    if (!users || users.length < 3) {
      console.log('Skipping: Unable to get enough users for group chat creation');
      return;
    }
    
    creator = users[0];
    members = users.slice(1); // All users except the creator
    
    // Generate group name and description
    const groupName = GROUP_NAME_TEMPLATES[Math.floor(Math.random() * GROUP_NAME_TEMPLATES.length)] + 
                     ` #${Math.floor(Math.random() * 1000)}`;
    const groupDescription = GROUP_DESCRIPTION_TEMPLATES[Math.floor(Math.random() * GROUP_DESCRIPTION_TEMPLATES.length)];
    
    // Prepare member IDs (excluding creator as they're automatically added)
    const memberIds = members.map(member => member.email);
    
    // Prepare variables for group chat creation
    const variables = {
      name: groupName,
      description: groupDescription,
      creatorId: creator.email,
      creatorNickname: creator.nickname,
      memberIds: memberIds
    };
    
    // Create group chat
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.CREATE_GROUP_CHAT,
      variables,
      creator.headers
    );
    
    // Validate response
    const success = check(response, {
      'group chat created successfully': (r) => r.status === 200,
      'response has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.createGroupChat;
        } catch (e) {
          return false;
        }
      },
      'chat room ID returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data.createGroupChat && body.data.createGroupChat.id;
        } catch (e) {
          return false;
        }
      },
      'chat type is group': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data.createGroupChat && body.data.createGroupChat.type === 'group';
        } catch (e) {
          return false;
        }
      },
      'group name matches': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data.createGroupChat && body.data.createGroupChat.name === groupName;
        } catch (e) {
          return false;
        }
      },
      'response time acceptable': (r) => r.timings.duration < 6000,
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
      console.error(`Group chat creation failed for creator ${creator.email}:`, response.body);
    } else {
      // Log successful group chat creation
      const body = JSON.parse(response.body);
      const chatRoom = body.data.createGroupChat;
      console.log(`✓ Group chat created: "${chatRoom.name}" (ID: ${chatRoom.id}) by ${creator.nickname} with ${memberIds.length} members`);
    }
    
    // Realistic pause between group chat creations (5-15 seconds)
    // Creating group chats is typically less frequent than other operations
    sleep(Math.random() * 10 + 5);
    
  } catch (error) {
    console.error('Group chat test execution error:', error);
    check(null, { 'test execution successful': () => false });
  }
}

// Setup function to initialize test data
export function setup() {
  console.log('Starting create group chat load test...');
  console.log(`Target: ${CONFIG.APPSYNC_URL}`);
  console.log(`Test Users: ${CONFIG.TEST_USERS.USERS.length}`);
  console.log(`Group Name Templates: ${GROUP_NAME_TEMPLATES.length}`);
  
  // Check if we have enough users for group chat testing
  if (CONFIG.TEST_USERS.USERS.length < 3) {
    throw new Error('Need at least 3 test users for group chat creation testing');
  }
  
  return {
    startTime: new Date().toISOString(),
    totalUsers: CONFIG.TEST_USERS.USERS.length,
    maxGroupSize: Math.min(5, CONFIG.TEST_USERS.USERS.length)
  };
}

// Teardown function to clean up after test
export function teardown(data) {
  console.log('Create group chat load test completed.');
  console.log(`Test duration: ${new Date().toISOString()} - ${data.startTime}`);
  console.log(`Total test users available: ${data.totalUsers}`);
  console.log(`Maximum group size tested: ${data.maxGroupSize}`);
}