import http from 'k6/http';
import { CONFIG } from './config.js';

// Real AWS Cognito Authentication Helper for k6 load testing
export class CognitoAuth {
  constructor() {
    this.userPoolId = CONFIG.USER_POOL_ID;
    this.clientId = CONFIG.CLIENT_ID;
    this.region = CONFIG.AWS_REGION;
    this.cognitoIdpEndpoint = `https://cognito-idp.${this.region}.amazonaws.com/`;
  }

  // Real Cognito authentication using USER_PASSWORD_AUTH flow
  authenticateUser(email, password) {
    const authPayload = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    };

    const params = {
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
      },
      timeout: '30s'
    };

    const response = http.post(
      this.cognitoIdpEndpoint,
      JSON.stringify(authPayload),
      params
    );

    if (response.status === 200) {
      const authResult = JSON.parse(response.body);
      
      if (authResult.AuthenticationResult) {
        return {
          AccessToken: authResult.AuthenticationResult.AccessToken,
          IdToken: authResult.AuthenticationResult.IdToken,
          RefreshToken: authResult.AuthenticationResult.RefreshToken,
          user: {
            email: email,
            nickname: this.getUserNickname(email)
          }
        };
      } else {
        throw new Error('Authentication failed: No AuthenticationResult in response');
      }
    } else {
      const errorBody = response.body;
      console.error(`Cognito auth failed for ${email}:`, response.status, errorBody);
      throw new Error(`Cognito authentication failed: ${response.status} - ${errorBody}`);
    }
  }

  // Get nickname from email for testing
  getUserNickname(email) {
    const userMap = {};
    CONFIG.TEST_USERS.USERS.forEach(user => {
      userMap[user.email] = user.nickname;
    });
    return userMap[email] || email.split('@')[0];
  }

  // Create Authorization header for AppSync requests
  createAuthHeaders(idToken) {
    return {
      'Content-Type': 'application/json',
      'Authorization': idToken, // Real JWT token from Cognito
    };
  }
}

// Test user pool for rotating through different users
export class TestUserPool {
  constructor() {
    this.users = CONFIG.TEST_USERS.USERS;
    this.authenticatedUsers = new Map();
    this.cognitoAuth = new CognitoAuth();
  }

  // Get a random test user
  getRandomUser() {
    const randomIndex = Math.floor(Math.random() * this.users.length);
    return this.users[randomIndex];
  }

  // Get authenticated user session
  getAuthenticatedUser(email = null) {
    let user;
    
    if (email) {
      user = this.users.find(u => u.email === email);
    } else {
      user = this.getRandomUser();
    }

    if (!user) {
      throw new Error('User not found in test pool');
    }

    // Check if user is already authenticated
    if (this.authenticatedUsers.has(user.email)) {
      return this.authenticatedUsers.get(user.email);
    }

    // Authenticate user with real Cognito
    const authResult = this.cognitoAuth.authenticateUser(user.email, user.password);
    
    const authenticatedUser = {
      email: user.email,
      nickname: user.nickname,
      accessToken: authResult.AccessToken,
      idToken: authResult.IdToken,
      headers: this.cognitoAuth.createAuthHeaders(authResult.IdToken)
    };

    // Cache authenticated user
    this.authenticatedUsers.set(user.email, authenticatedUser);
    
    return authenticatedUser;
  }

  // Get multiple authenticated users for group chats
  getMultipleUsers(count = 3) {
    const users = [];
    const shuffledUsers = [...this.users].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(count, shuffledUsers.length); i++) {
      const user = this.getAuthenticatedUser(shuffledUsers[i].email);
      users.push(user);
    }
    
    return users;
  }
}

// Utility function to make GraphQL requests
export function makeGraphQLRequest(url, query, variables, headers) {
  const payload = JSON.stringify({
    query: query,
    variables: variables
  });

  const params = {
    headers: headers,
    timeout: '30s'
  };

  return http.post(url, payload, params);
}