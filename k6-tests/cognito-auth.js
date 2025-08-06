import http from 'k6/http';
import { CONFIG } from './config.js';

// Real AWS Cognito authentication for k6 testing
export class RealCognitoAuth {
  constructor() {
    this.userPoolId = CONFIG.USER_POOL_ID;
    this.clientId = CONFIG.CLIENT_ID;
    this.region = CONFIG.AWS_REGION;
    
    // AWS Cognito endpoints
    this.cognitoIdpEndpoint = `https://cognito-idp.${this.region}.amazonaws.com/`;
  }

  // Authenticate user with AWS Cognito using InitiateAuth API
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
      console.error('Cognito auth failed:', response.status, errorBody);
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