import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { AppSyncResolverHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface CreateGroupChatInput {
  name: string;
  description?: string;
  creatorId: string;
  creatorNickname: string;
  memberIds: string[];
}

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const handler: AppSyncResolverHandler<CreateGroupChatInput, ChatRoom> = async (event) => {
  
  const { name, description, creatorId, creatorNickname, memberIds } = event.arguments;
  
  if (!name || !creatorId || !creatorNickname || !memberIds || memberIds.length === 0) {
    throw new Error('Missing required fields: name, creatorId, creatorNickname, memberIds');
  }
  
  // Validate group name
  if (name.trim().length < 1 || name.trim().length > 50) {
    throw new Error('Group name must be between 1 and 50 characters');
  }
  
  // Validate member count (including creator)
  const allMemberIds = Array.from(new Set([creatorId, ...memberIds])); // Remove duplicates
  if (allMemberIds.length > 50) {
    throw new Error('Group chat cannot have more than 50 members');
  }
  
  try {
    // 1. Verify all users exist
    const userKeys = allMemberIds.map(userId => ({ email: userId }));
    const batchGetResult = await docClient.send(new BatchGetCommand({
      RequestItems: {
        [process.env.DYNAMODB_TABLE_USER!]: {
          Keys: userKeys
        }
      }
    }));
    
    const existingUsers = batchGetResult.Responses?.[process.env.DYNAMODB_TABLE_USER!] || [];
    const existingUserIds = existingUsers.map(user => user.email);
    
    const missingUsers = allMemberIds.filter(id => !existingUserIds.includes(id));
    if (missingUsers.length > 0) {
      throw new Error(`Users not found: ${missingUsers.join(', ')}`);
    }
    
    // 2. Create group chat room
    const chatRoomId = randomUUID();
    const now = new Date().toISOString();
    
    const chatRoom: ChatRoom = {
      id: chatRoomId,
      name: name.trim(),
      type: 'group',
      description: description?.trim() || `Group chat created by ${creatorNickname}`,
      createdAt: now,
      updatedAt: now
    };
    
    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_CHATROOM,
      Item: chatRoom
    }));
    
    // 3. Add all members to the group
    const membershipPromises = allMemberIds.map(async (userId) => {
      const user = existingUsers.find(u => u.email === userId);
      const isCreator = userId === creatorId;
      
      const membership = {
        id: randomUUID(),
        chatRoomId,
        userId,
        userNickname: user?.nickname || userId,
        role: isCreator ? 'admin' : 'member',
        joinedAt: now,
        createdAt: now,
        updatedAt: now
      };
      
      return docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_CHATROOMEMBER,
        Item: membership
      }));
    });
    
    await Promise.all(membershipPromises);
    
    
    return chatRoom;
    
  } catch (error) {
    throw new Error(`Failed to create group chat: ${(error as Error).message}`);
  }
};