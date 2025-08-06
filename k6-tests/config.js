// k6 Test Configuration for LINE Clone App
export const CONFIG = {
  // AWS AppSync GraphQL endpoint
  APPSYNC_URL: 'https://i2ihkr3l6nbkxm7viekuwsoxku.appsync-api.ap-southeast-1.amazonaws.com/graphql',
  
  // AWS Region
  AWS_REGION: 'ap-southeast-1',
  
  // Cognito Configuration
  USER_POOL_ID: 'ap-southeast-1_kdnEacZ2M',
  CLIENT_ID: '6h5tmnfqkq2p51o1fferhn7hl4',
  
  // Test Users Configuration - Real Cognito users created for testing
  TEST_USERS: {
    USERS: [
      { email: 'testuser1@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser1' },
      { email: 'testuser2@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser2' },
      { email: 'testuser3@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser3' },
      { email: 'testuser4@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser4' },
      { email: 'testuser5@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser5' },
      { email: 'testuser6@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser6' },
      { email: 'testuser7@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser7' },
      { email: 'testuser8@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser8' },
      { email: 'testuser9@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser9' },
      { email: 'testuser10@k6loadtest.com', password: 'TestPass123!', nickname: 'TestUser10' },
    ]
  },
  
  // Load Test Configuration for 1000 concurrent users
  LOAD_TEST: {
    STAGES: [
      { duration: '1m', target: 200 },   // ช้าลง
      { duration: '2m', target: 500 },
      { duration: '5m', target: 800 },
      { duration: '5m', target: 1000 },  // ใช้เวลานาน = ไม่โดน rate limit
      { duration: '5m', target: 1000 },
      { duration: '5m', target: 0 },
    ],
    THRESHOLDS: {
      http_req_duration: ['p(95)<5000'], // 95% of requests must complete within 5s
      http_req_failed: ['rate<0.1'],     // Error rate must be less than 10%
      checks: ['rate>0.9'],              // 90% of checks must pass
    }
  }
};

// GraphQL Queries and Mutations
export const GRAPHQL_OPERATIONS = {
  // Send Message Mutation
  SEND_MESSAGE: `
    mutation SendMessage($chatRoomId: String!, $content: String!, $senderId: String!, $senderNickname: String!, $type: String) {
      sendMessage(chatRoomId: $chatRoomId, content: $content, senderId: $senderId, senderNickname: $senderNickname, type: $type) {
        id
        content
        chatRoomId
        senderId
        senderNickname
        createdAt
      }
    }
  `,
  
  // Create Private Chat Mutation
  CREATE_PRIVATE_CHAT: `
    mutation CreatePrivateChat($currentUserId: String!, $targetUserId: String!, $currentUserNickname: String!, $targetUserNickname: String!) {
      createPrivateChat(currentUserId: $currentUserId, targetUserId: $targetUserId, currentUserNickname: $currentUserNickname, targetUserNickname: $targetUserNickname) {
        id
        name
        type
        createdAt
      }
    }
  `,
  
  // Create Group Chat Mutation
  CREATE_GROUP_CHAT: `
    mutation CreateGroupChat($name: String!, $description: String, $creatorId: String!, $creatorNickname: String!, $memberIds: [String!]!) {
      createGroupChat(name: $name, description: $description, creatorId: $creatorId, creatorNickname: $creatorNickname, memberIds: $memberIds) {
        id
        name
        type
        description
        createdAt
      }
    }
  `,
  
  // Get User Query
  GET_USER: `
    query GetUser($email: String!) {
      getUser(email: $email) {
        email
        nickname
        avatar
        description
      }
    }
  `,
  
  // List Chat Room Members Query
  LIST_CHAT_ROOM_MEMBERS: `
    query ListChatRoomMembers($chatRoomId: ID!) {
      listChatRoomMembers(filter: {chatRoomId: {eq: $chatRoomId}}) {
        items {
          id
          userId
          userNickname
          role
        }
      }
    }
  `
};