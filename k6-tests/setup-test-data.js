import { check } from 'k6';
import { TestUserPool, makeGraphQLRequest } from './auth-helper.js';
import { CONFIG, GRAPHQL_OPERATIONS } from './config.js';

// Test data setup script - run this before load testing
export const options = {
  vus: 1,
  iterations: 1, // Run only once to set up test data
  thresholds: {
    checks: ['rate>0.8'], // 80% of setup operations should succeed
  }
};

const userPool = new TestUserPool();

// Pre-create some chat rooms and test data for realistic load testing
export default async function setupTestData() {
  console.log('🔧 Setting up test data for load testing...');
  
  try {
    // Step 1: Verify test users exist or create sample test scenario
    console.log('👥 Verifying test users...');
    await verifyTestUsers();
    
    // Step 2: Create initial chat rooms for message testing
    console.log('🏠 Creating initial chat rooms...');
    await createInitialChatRooms();
    
    // Step 3: Create some initial private chats
    console.log('💬 Creating sample private chats...');
    await createSamplePrivateChats();
    
    // Step 4: Create some sample group chats
    console.log('👥 Creating sample group chats...');
    await createSampleGroupChats();
    
    console.log('✅ Test data setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Test data setup failed:', error);
    throw error;
  }
}

async function verifyTestUsers() {
  console.log(`Configured test users: ${CONFIG.TEST_USERS.USERS.length}`);
  
  // Log test user configuration
  CONFIG.TEST_USERS.USERS.forEach((user, index) => {
    console.log(`  ${index + 1}. ${user.nickname} (${user.email})`);
  });
  
  if (CONFIG.TEST_USERS.USERS.length < 5) {
    console.warn('⚠️  Warning: Less than 5 test users configured. Consider adding more for better load testing.');
  }
  
  console.log('ℹ️  Note: Make sure these users exist in your Cognito User Pool before running load tests.');
  console.log('ℹ️  For actual testing, replace mock authentication with real Cognito tokens.');
}

async function createInitialChatRooms() {
  // Create some private chats between different user pairs
  const users = await userPool.getMultipleUsers(4);
  if (users.length < 2) {
    console.log('⚠️  Skipping chat room creation - not enough users');
    return;
  }
  
  const chatPairs = [
    [users[0], users[1]],
    [users[0], users[2] || users[1]],
    [users[1], users[2] || users[0]],
  ];
  
  for (const [user1, user2] of chatPairs) {
    if (user1.email === user2.email) continue;
    
    const variables = {
      currentUserId: user1.email,
      targetUserId: user2.email,
      currentUserNickname: user1.nickname,
      targetUserNickname: user2.nickname
    };
    
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.CREATE_PRIVATE_CHAT,
      variables,
      user1.headers
    );
    
    const success = check(response, {
      'initial private chat created': (r) => r.status === 200
    });
    
    if (success) {
      console.log(`  ✓ Created private chat: ${user1.nickname} ↔ ${user2.nickname}`);
    } else {
      console.log(`  ⚠️  Failed to create private chat: ${user1.nickname} ↔ ${user2.nickname}`);
    }
  }
}

async function createSamplePrivateChats() {
  const users = await userPool.getMultipleUsers(3);
  if (users.length < 2) return;
  
  // Create 2-3 sample private chats
  const privateChatCount = Math.min(3, users.length - 1);
  
  for (let i = 0; i < privateChatCount; i++) {
    const user1 = users[0];
    const user2 = users[i + 1];
    
    const variables = {
      currentUserId: user1.email,
      targetUserId: user2.email,
      currentUserNickname: user1.nickname,
      targetUserNickname: user2.nickname
    };
    
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.CREATE_PRIVATE_CHAT,
      variables,
      user1.headers
    );
    
    const success = check(response, {
      'sample private chat created': (r) => r.status === 200
    });
    
    if (success) {
      console.log(`  ✓ Sample private chat: ${user1.nickname} ↔ ${user2.nickname}`);
    }
  }
}

async function createSampleGroupChats() {
  const users = await userPool.getMultipleUsers(4);
  if (users.length < 3) {
    console.log('  ⚠️  Not enough users for group chat creation');
    return;
  }
  
  const sampleGroups = [
    {
      name: 'Load Test Team',
      description: 'Team coordination for load testing',
      members: users.slice(0, 3)
    },
    {
      name: 'Performance Testing Group',
      description: 'Discussing performance optimization strategies',
      members: users.slice(0, Math.min(4, users.length))
    }
  ];
  
  for (const group of sampleGroups) {
    const creator = group.members[0];
    const memberIds = group.members.slice(1).map(u => u.email);
    
    const variables = {
      name: group.name,
      description: group.description,
      creatorId: creator.email,
      creatorNickname: creator.nickname,
      memberIds: memberIds
    };
    
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.CREATE_GROUP_CHAT,
      variables,
      creator.headers
    );
    
    const success = check(response, {
      'sample group chat created': (r) => r.status === 200
    });
    
    if (success) {
      console.log(`  ✓ Sample group chat: "${group.name}" (${group.members.length} members)`);
    } else {
      console.log(`  ⚠️  Failed to create group chat: "${group.name}"`);
    }
  }
}

export function teardown() {
  console.log('🏁 Test data setup completed.');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Verify that the chat rooms were created in your database');
  console.log('2. Run individual tests: k6 run send-message-test.js');
  console.log('3. Run master load test: k6 run master-load-test.js');
  console.log('4. Monitor your AWS CloudWatch metrics during testing');
  console.log('');
  console.log('⚠️  Important: Update auth-helper.js with real Cognito authentication for production testing!');
}