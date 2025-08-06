import { check } from 'k6';
import { TestUserPool, makeGraphQLRequest } from './auth-helper.js';
import { CONFIG, GRAPHQL_OPERATIONS } from './config.js';

export const options = {
  vus: 1,
  iterations: 1,
};

const userPool = new TestUserPool();

export default function() {
  console.log('🔍 Debug Test - Checking authentication and API calls...');
  
  try {
    // Test user authentication
    const user = userPool.getAuthenticatedUser();
    console.log('✅ User authenticated:', user.email, user.nickname);
    console.log('🔑 Headers:', JSON.stringify(user.headers, null, 2));
    
    // Test GraphQL request with detailed logging
    const variables = {
      chatRoomId: 'test-chatroom-1',
      content: 'Debug test message',
      senderId: user.email,
      senderNickname: user.nickname,
      type: 'text'
    };
    
    console.log('📤 Sending GraphQL request with variables:', JSON.stringify(variables, null, 2));
    
    const response = makeGraphQLRequest(
      CONFIG.APPSYNC_URL,
      GRAPHQL_OPERATIONS.SEND_MESSAGE,
      variables,
      user.headers
    );
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', JSON.stringify(response.headers, null, 2));
    console.log('📥 Response body:', response.body);
    
    check(response, {
      'status is 200': (r) => r.status === 200,
      'has response body': (r) => r.body && r.body.length > 0,
    });
    
  } catch (error) {
    console.error('❌ Debug test error:', error);
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
  }
}