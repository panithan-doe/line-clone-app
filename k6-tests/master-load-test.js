import { check, sleep, group } from 'k6';
import { TestUserPool, makeGraphQLRequest } from './auth-helper.js';
import { CONFIG, GRAPHQL_OPERATIONS } from './config.js';

// Master load test configuration for 1000 concurrent users
export const options = {
  thresholds: CONFIG.LOAD_TEST.THRESHOLDS,
  
  // Additional configuration for large scale testing
  discardResponseBodies: false, // Keep response bodies for debugging
  scenarios: {
    // Mixed workload scenario simulating real user behavior
    mixed_workload: {
      executor: 'ramping-vus',
      stages: CONFIG.LOAD_TEST.STAGES,
      gracefulRampDown: '2m',
      startVUs: 1,
    }
  }
};

// Shared test user pool
const userPool = new TestUserPool();

// Test data for realistic scenarios
const SAMPLE_CHAT_ROOMS = [
  'general-chat', 'project-alpha', 'team-updates', 'random-discussions',
  'tech-talk', 'design-reviews', 'marketing-team', 'dev-team',
  'product-feedback', 'support-chat'
];

const MESSAGE_TEMPLATES = [
  'Hey everyone! 👋',
  'Quick question about the project timeline.',
  'Great work on the latest feature!',
  'Can someone help me with this issue?',
  'Meeting scheduled for 2 PM today.',
  'Weekend plans anyone? 🎉',
  'Just pushed the latest changes to staging.',
  'Coffee break in 10 minutes! ☕',
  'This is a longer message to test message handling with more detailed content and multiple sentences.',
  '🚀 Deployed to production successfully!',
  'Thanks for the quick response!',
  'Let me know if you need any clarification.',
];

const GROUP_NAMES = [
  'Project Team', 'Study Group', 'Gaming Squad', 'Book Club',
  'Travel Planning', 'Tech Discussion', 'Design Team', 'Marketing'
];

const GROUP_DESCRIPTIONS = [
  'Collaborative workspace for our team.',
  'Knowledge sharing and learning together.',
  'Gaming coordination and tournaments.',
  'Monthly book reviews and discussions.'
];

// User behavior simulation weights (percentage of actions)
const ACTION_WEIGHTS = {
  SEND_MESSAGE: 70,      // 70% - Most common action
  CREATE_PRIVATE_CHAT: 20, // 20% - Moderate frequency
  CREATE_GROUP_CHAT: 10    // 10% - Least frequent
};

export default function() {
  let user;
  
  try {
    // Get authenticated user for this virtual user session
    user = userPool.getAuthenticatedUser();
    
    // Determine action based on weights (simulating realistic user behavior)
    const actionRoll = Math.random() * 100;
    
    if (actionRoll < ACTION_WEIGHTS.SEND_MESSAGE) {
      // Send Message (70% of actions)
      performSendMessage(user);
      
    } else if (actionRoll < ACTION_WEIGHTS.SEND_MESSAGE + ACTION_WEIGHTS.CREATE_PRIVATE_CHAT) {
      // Create Private Chat (20% of actions)
      performCreatePrivateChat(user);
      
    } else {
      // Create Group Chat (10% of actions)
      performCreateGroupChat(user);
    }
    
    // Realistic user pause (varies by action type)
    const pauseTime = getRealisticPause(actionRoll);
    sleep(pauseTime);
    
  } catch (error) {
    console.error('Master test execution error:', error);
    check(null, { 'test execution successful': () => false });
  }
}

// Send message functionality
async function performSendMessage(user) {
  return group('Send Message', () => {
    const chatRoomId = SAMPLE_CHAT_ROOMS[Math.floor(Math.random() * SAMPLE_CHAT_ROOMS.length)];
    const messageContent = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
    
    const variables = {
      chatRoomId,
      content: messageContent,
      senderId: user.email,
      senderNickname: user.nickname,
      type: 'text'
    };
    
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.SEND_MESSAGE,
      variables,
      user.headers
    );
    
    return check(response, {
      'message sent': (r) => r.status === 200,
      // 'message has ID': (r) => {
      //   try {
      //     const body = JSON.parse(r.body);
      //     return body.data?.sendMessage?.id;
      //   } catch (e) {
      //     return false;
      //   }
      // },
      'message send time < 3s': (r) => r.timings.duration < 3000,
    });
  });
}

// Create private chat functionality  
function performCreatePrivateChat(user) {
  return group('Create Private Chat', () => {
    const users = userPool.getMultipleUsers(2);
    if (users.length < 2) return false;
    
    const currentUser = users[0];
    const targetUser = users[1];
    
    const variables = {
      currentUserId: currentUser.email,
      targetUserId: targetUser.email,
      currentUserNickname: currentUser.nickname,
      targetUserNickname: targetUser.nickname
    };
    
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.CREATE_PRIVATE_CHAT,
      variables,
      user.headers
    );
    
    return check(response, {
      'private chat created': (r) => r.status === 200,
      'chat has ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data?.createPrivateChat?.id;
        } catch (e) {
          return false;
        }
      },
      'chat type is private': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data?.createPrivateChat?.type === 'private';
        } catch (e) {
          return false;
        }
      },
      'private chat time < 5s': (r) => r.timings.duration < 5000,
    });
  });
}

// Create group chat functionality
function performCreateGroupChat(user) {
  return group('Create Group Chat', () => {
    const groupSize = Math.floor(Math.random() * 3) + 3; // 3-5 users
    const users = userPool.getMultipleUsers(groupSize);
    if (users.length < 3) return false;
    
    const creator = users[0];
    const memberIds = users.slice(1).map(u => u.email);
    
    const groupName = GROUP_NAMES[Math.floor(Math.random() * GROUP_NAMES.length)] + 
                     ` #${Math.floor(Math.random() * 1000)}`;
    const groupDescription = GROUP_DESCRIPTIONS[Math.floor(Math.random() * GROUP_DESCRIPTIONS.length)];
    
    const variables = {
      name: groupName,
      description: groupDescription,
      creatorId: creator.email,
      creatorNickname: creator.nickname,
      memberIds
    };
    
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.CREATE_GROUP_CHAT,
      variables,
      user.headers
    );
    
    return check(response, {
      'group chat created': (r) => r.status === 200,
      'group has ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data?.createGroupChat?.id;
        } catch (e) {
          return false;
        }
      },
      'chat type is group': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data?.createGroupChat?.type === 'group';
        } catch (e) {
          return false;
        }
      },
      'group chat time < 8s': (r) => r.timings.duration < 8000,
    });
  });
}

// Get realistic pause time based on action type
function getRealisticPause(actionRoll) {
  if (actionRoll < ACTION_WEIGHTS.SEND_MESSAGE) {
    // Messages: 1-5 seconds
    return Math.random() * 4 + 1;
  } else if (actionRoll < ACTION_WEIGHTS.SEND_MESSAGE + ACTION_WEIGHTS.CREATE_PRIVATE_CHAT) {
    // Private chats: 3-8 seconds
    return Math.random() * 5 + 3;
  } else {
    // Group chats: 5-15 seconds
    return Math.random() * 10 + 5;
  }
}

// Setup function
export function setup() {
  console.log('🚀 Starting master load test for 1000 concurrent users...');
  console.log(`📊 Target: ${CONFIG.APPSYNC_URL}`);
  console.log(`👥 Test Users: ${CONFIG.TEST_USERS.USERS.length}`);
  console.log(`📝 Message Templates: ${MESSAGE_TEMPLATES.length}`);
  console.log(`🏠 Sample Chat Rooms: ${SAMPLE_CHAT_ROOMS.length}`);
  console.log(`📈 Load Profile: ${CONFIG.LOAD_TEST.STAGES.map(s => `${s.target} users for ${s.duration}`).join(' → ')}`);
  console.log('');
  console.log('Action Distribution:');
  console.log(`  📨 Send Messages: ${ACTION_WEIGHTS.SEND_MESSAGE}%`);
  console.log(`  💬 Private Chats: ${ACTION_WEIGHTS.CREATE_PRIVATE_CHAT}%`);
  console.log(`  👥 Group Chats: ${ACTION_WEIGHTS.CREATE_GROUP_CHAT}%`);
  console.log('');
  
  return {
    startTime: new Date().toISOString(),
    totalUsers: CONFIG.TEST_USERS.USERS.length
  };
}

// Teardown function
export function teardown(data) {
  console.log('');
  console.log('🏁 Master load test completed!');
  console.log(`⏱️  Duration: ${data.startTime} → ${new Date().toISOString()}`);
  console.log(`👥 Total test users: ${data.totalUsers}`);
  console.log('📊 Check the summary report above for detailed performance metrics.');
}