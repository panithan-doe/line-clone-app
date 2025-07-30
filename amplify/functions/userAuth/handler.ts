import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { AppSyncResolverHandler } from 'aws-lambda';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const cognitoClient = new CognitoIdentityProviderClient({});

interface CreateUserInput {
  email: string;
  nickname: string;
  description?: string;
}

interface VerifyUserInput {
  email: string;
}

interface User {
  email: string;
  nickname: string;
  avatar?: string;
  description?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User;
  isNewUser: boolean;
  cognitoUser?: any;
}

// Create or get user after successful authentication
export const createUserAfterAuth = async (event: any, context: any) => {
  console.log('Create user after auth event:', JSON.stringify(event, null, 2));
  
  const { email, nickname, description } = event.arguments;
  
  if (!email || !nickname) {
    throw new Error('Email and nickname are required');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  // Validate nickname
  if (nickname.trim().length < 1 || nickname.trim().length > 50) {
    throw new Error('Nickname must be between 1 and 50 characters');
  }
  
  try {
    // 1. Check if user already exists in DynamoDB
    const existingUser = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_USER,
      Key: { email }
    }));
    
    if (existingUser.Item) {
      console.log('User already exists:', email);
      return {
        user: existingUser.Item as User,
        isNewUser: false
      };
    }
    
    // 2. Verify user exists in Cognito (should exist after successful auth)
    let cognitoUser;
    try {
      const cognitoResponse = await cognitoClient.send(new AdminGetUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: email
      }));
      cognitoUser = cognitoResponse;
    } catch (cognitoError) {
      console.warn('User not found in Cognito, but proceeding with DynamoDB creation:', cognitoError);
    }
    
    // 3. Create new user in DynamoDB
    const now = new Date().toISOString();
    const newUser: User = {
      email,
      nickname: nickname.trim(),
      description: description?.trim(),
      owner: email, // Set owner field for authorization
      createdAt: now,
      updatedAt: now
    };
    
    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_USER,
      Item: newUser,
      ConditionExpression: 'attribute_not_exists(email)' // Prevent overwriting
    }));
    
    console.log('New user created successfully:', email);
    
    return {
      user: newUser,
      isNewUser: true,
      cognitoUser
    };
    
  } catch (error) {
    console.error('Error creating user after auth:', error);
    
    // If it's a condition check failure, user was created concurrently
    if ((error as any).name === 'ConditionalCheckFailedException') {
      const existingUser = await docClient.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_USER,
        Key: { email }
      }));
      
      return {
        user: existingUser.Item as User,
        isNewUser: false
      };
    }
    
    throw new Error(`Failed to create user: ${(error as Error).message}`);
  }
};

// Verify user exists and get profile
export const verifyUser = async (event: any, context: any) => {
  console.log('=== VERIFY USER START ===');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Table name:', process.env.DYNAMODB_TABLE_USER);
  
  const { email } = event.arguments;
  console.log('Looking for email:', email);
  
  if (!email) {
    console.log('ERROR: Email is required');
    throw new Error('Email is required');
  }
  
  try {
    console.log('Querying DynamoDB with GetCommand...');
    
    // Get user from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_USER,
      Key: { email }
    }));
    
    console.log('DynamoDB GetCommand result:', JSON.stringify(result, null, 2));
    
    if (!result.Item) {
      console.log('User not found in DynamoDB for email:', email);
      console.log('Result was:', result);
      return null;
    }
    
    console.log('Raw user data from DynamoDB:', JSON.stringify(result.Item, null, 2));
    
    // Ensure all required fields have default values
    const user = result.Item as User;
    const userWithDefaults = {
      ...user,
      nickname: user.nickname || user.email || 'Unknown User',
      description: user.description,
      avatar: user.avatar || null,
      owner: user.owner || user.email, // Ensure owner field exists
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    };
    
    console.log('Final user data with defaults:', JSON.stringify(userWithDefaults, null, 2));
    console.log('=== VERIFY USER END ===');
    return userWithDefaults;
    
  } catch (error) {
    console.error('ERROR in verifyUser:', error);
    console.error('Error stack:', (error as Error).stack);
    throw new Error(`Failed to verify user: ${(error as Error).message}`);
  }
};

// Update user profile
interface UpdateUserProfileInput {
  email: string;
  nickname?: string;
  description?: string;
  avatar?: string;
}

export const updateUserProfile = async (event: any, context: any) => {
  console.log('Update user profile event:', JSON.stringify(event, null, 2));
  console.log('Environment variables:', {
    DYNAMODB_TABLE_USER: process.env.DYNAMODB_TABLE_USER,
    USER_POOL_ID: process.env.USER_POOL_ID
  });
  
  const { email, nickname, description, avatar } = event.arguments;
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  try {
    // Build update expression
    const updateExpressions: string[] = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: any = {
      ':updatedAt': new Date().toISOString()
    };
    
    if (nickname !== undefined) {
      if (nickname.trim().length < 1 || nickname.trim().length > 50) {
        throw new Error('Nickname must be between 1 and 50 characters');
      }
      updateExpressions.push('nickname = :nickname');
      expressionAttributeValues[':nickname'] = nickname.trim();
    }
    
    if (description !== undefined) {
      updateExpressions.push('description = :description');
      expressionAttributeValues[':description'] = description.trim();
    }
    
    if (avatar !== undefined) {
      updateExpressions.push('avatar = :avatar');
      expressionAttributeValues[':avatar'] = avatar;
    }
    
    console.log('DynamoDB Update Parameters:', {
      TableName: process.env.DYNAMODB_TABLE_USER,
      Key: { email },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_USER,
      Key: { email },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
      // Removed ConditionExpression to allow updates even if user record is incomplete
    }));
    
    console.log('User profile updated successfully:', email);
    console.log('Updated user record:', JSON.stringify(result.Attributes, null, 2));
    console.log('Items that were actually updated:', updateExpressions);
    return result.Attributes as User;
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    console.error('Error name:', (error as any).name);
    console.error('Error code:', (error as any).code);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    if ((error as any).name === 'ConditionalCheckFailedException') {
      throw new Error('User not found');
    }
    
    if ((error as any).name === 'ResourceNotFoundException') {
      throw new Error(`DynamoDB table not found: ${process.env.DYNAMODB_TABLE_USER}`);
    }
    
    throw new Error(`Failed to update user profile: ${(error as Error).message}`);
  }
};

// Export the main handler (you can switch between functions based on event type)
export const handler: AppSyncResolverHandler<any, any> = async (event) => {
  console.log('=== USER AUTH HANDLER START ===');
  console.log('Full event:', JSON.stringify(event, null, 2));
  console.log('Event info object:', JSON.stringify(event.info, null, 2));
  console.log('Field name:', event.info?.fieldName);
  console.log('Event arguments:', event.arguments);
  console.log('Event keys:', Object.keys(event));
  
  try {
    let result;
    // From the logs, we see fieldName is at top level, not in event.info
    const eventWithFieldName = event as any;
    const fieldName = eventWithFieldName.fieldName || event.info?.fieldName;
    console.log('Actual fieldName being used:', fieldName);
    
    // Route to appropriate function based on field name
    switch (fieldName) {
      case 'createUserAfterAuth':
        console.log('Routing to createUserAfterAuth');
        result = await createUserAfterAuth(event, {});
        break;
      case 'verifyUser':
        console.log('Routing to verifyUser');
        result = await verifyUser(event, {});
        break;
      case 'updateUserProfile':
        console.log('Routing to updateUserProfile');
        result = await updateUserProfile(event, {});
        break;
      default:
        console.log('ERROR: Unknown operation:', fieldName);
        throw new Error(`Unknown operation: ${fieldName}`);
    }
    
    console.log('Handler result:', JSON.stringify(result, null, 2));
    console.log('=== USER AUTH HANDLER END ===');
    return result;
  } catch (error) {
    console.error('Handler error:', error);
    throw error;
  }
};