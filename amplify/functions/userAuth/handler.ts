import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface User {
  email: string;
  nickname: string;
  avatar?: string;
  description?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

// Create user in DynamoDB
const createUser = async (event: any) => {
  const { email, nickname } = event.arguments;
  
  if (!email || !nickname) {
    throw new Error('Email and nickname are required');
  }
  
  try {
    const now = new Date().toISOString();
    const newUser: User = {
      email,
      nickname: nickname.trim(),
      description: '',
      owner: email,
      createdAt: now,
      updatedAt: now
    };
    
    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_USER!,
      Item: newUser,
      ConditionExpression: 'attribute_not_exists(email)' // Prevent overwriting
    }));
    
    return newUser;
  } catch (error) {
    if ((error as any).name === 'ConditionalCheckFailedException') {
      throw new Error('User already exists');
    }
    throw new Error(`Failed to create user: ${(error as Error).message}`);
  }
};

// Verify user exists and get profile
const verifyUser = async (event: any) => {
  const { email } = event.arguments;
  
  if (!email) {
    throw new Error('Email is required');
  }
  
  try {
    // Get user from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_USER,
      Key: { email }
    }));
    
    if (!result.Item) {
      return null;
    }
    
    // Ensure all required fields have default values
    const user = result.Item as User;
    const userWithDefaults = {
      ...user,
      nickname: user.nickname || user.email || 'Unknown User',
      description: user.description || '',
      avatar: user.avatar || null,
      owner: user.owner || user.email, // Ensure owner field exists
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    };
    
    return userWithDefaults;
    
  } catch (error) {
    throw new Error(`Failed to verify user: ${(error as Error).message}`);
  }
};

// Update user profile
const updateUserProfile = async (event: any) => {
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
      expressionAttributeValues[':description'] = description?.trim() || '';
    }
    
    if (avatar !== undefined) {
      updateExpressions.push('avatar = :avatar');
      expressionAttributeValues[':avatar'] = avatar;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_USER,
      Key: { email },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(email)' // Ensure user exists before updating
    }));
    
    return result.Attributes as User;
    
  } catch (error) {
    if ((error as any).name === 'ConditionalCheckFailedException') {
      throw new Error('User not found');
    }
    
    if ((error as any).name === 'ResourceNotFoundException') {
      throw new Error(`DynamoDB table not found: ${process.env.DYNAMODB_TABLE_USER}`);
    }
    
    throw new Error(`Failed to update user profile: ${(error as Error).message}`);
  }
};

// AppSync resolver handler - only for data operations
export const handler = async (event: any) => {
  console.log('📡 AppSync resolver handler called');
  console.log('🔍 Event keys:', Object.keys(event || {}));
  
  const eventWithFieldName = event as any;
  const fieldName = eventWithFieldName.fieldName || event.info?.fieldName;
  
  console.log('🎯 Field name:', fieldName);
  
  // Route to appropriate function based on field name
  switch (fieldName) {
    case 'createUserAccount':
      return await createUser(event);
    case 'verifyUser':
      return await verifyUser(event);
    case 'updateUserProfile':
      return await updateUserProfile(event);
    default:
      throw new Error(`Unknown operation: ${fieldName}`);
  }
};