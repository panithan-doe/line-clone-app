import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AppSyncResolverEvent, AppSyncResolverHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface CreatePrivateChatInput {
  currentUserId: string;
  targetUserId: string;
  currentUserNickname: string;
  targetUserNickname: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const handler: AppSyncResolverHandler<CreatePrivateChatInput, ChatRoom> = async (event) => {
  console.log('Create private chat event:', JSON.stringify(event, null, 2));
  
  const { currentUserId, targetUserId, currentUserNickname, targetUserNickname } = event.arguments;
  
  if (!currentUserId || !targetUserId || !currentUserNickname || !targetUserNickname) {
    throw new Error('Missing required fields');
  }
  
  if (currentUserId === targetUserId) {
    throw new Error('Cannot create private chat with yourself');
  }
  
  try {
    // 1. Check if private chat already exists between these users
    const existingChats = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_CHATROOMEMBER,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :currentUserId',
      ExpressionAttributeValues: {
        ':currentUserId': currentUserId
      }
    }));
    
    // Check if any of the current user's chat rooms also contain the target user
    for (const membership of existingChats.Items || []) {
      const chatRoomId = membership.chatRoomId;
      
      // Check if this chat room is private and contains the target user
      const chatRoom = await docClient.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_CHATROOM,
        Key: { id: chatRoomId }
      }));
      
      if (chatRoom.Item && chatRoom.Item.type === 'private') {
        // Check if target user is in this chat room
        const targetMembership = await docClient.send(new QueryCommand({
          TableName: process.env.DYNAMODB_TABLE_CHATROOMEMBER,
          IndexName: 'chatRoomId-userId-index',
          KeyConditionExpression: 'chatRoomId = :chatRoomId AND userId = :targetUserId',
          ExpressionAttributeValues: {
            ':chatRoomId': chatRoomId,
            ':targetUserId': targetUserId
          }
        }));
        
        if (targetMembership.Items && targetMembership.Items.length > 0) {
          console.log('Private chat already exists:', chatRoomId);
          return chatRoom.Item as ChatRoom;
        }
      }
    }
    
    // 2. Verify both users exist
    const [currentUser, targetUser] = await Promise.all([
      docClient.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_USER,
        Key: { email: currentUserId }
      })),
      docClient.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_USER,
        Key: { email: targetUserId }
      }))
    ]);
    
    if (!currentUser.Item || !targetUser.Item) {
      throw new Error('One or both users do not exist');
    }
    
    // 3. Create new private chat room
    const chatRoomId = randomUUID();
    const now = new Date().toISOString();
    
    const chatRoom: ChatRoom = {
      id: chatRoomId,
      name: targetUserNickname, // For private chats, name is the other user's nickname
      type: 'private',
      description: `Private chat between ${currentUserNickname} and ${targetUserNickname}`,
      createdAt: now,
      updatedAt: now
    };
    
    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_CHATROOM,
      Item: chatRoom
    }));
    
    // 4. Add both users as members
    const currentMembership = {
      id: randomUUID(),
      chatRoomId,
      userId: currentUserId,
      userNickname: currentUserNickname,
      role: 'member',
      joinedAt: now,
      createdAt: now,
      updatedAt: now
    };
    
    const targetMembership = {
      id: randomUUID(),
      chatRoomId,
      userId: targetUserId,
      userNickname: targetUserNickname,
      role: 'member',
      joinedAt: now,
      createdAt: now,
      updatedAt: now
    };
    
    await Promise.all([
      docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_CHATROOMEMBER,
        Item: currentMembership
      })),
      docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_CHATROOMEMBER,
        Item: targetMembership
      }))
    ]);
    
    console.log('Private chat created successfully:', chatRoomId);
    return chatRoom;
    
  } catch (error) {
    console.error('Error creating private chat:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(`Failed to create private chat: ${errorMessage}`);
  }
};