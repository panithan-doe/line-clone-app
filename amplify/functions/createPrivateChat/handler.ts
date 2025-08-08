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
  const { currentUserId, targetUserId, currentUserNickname, targetUserNickname } = event.arguments;
  
  if (!currentUserId || !targetUserId || !currentUserNickname || !targetUserNickname) {
    throw new Error('Missing required fields');
  }
  
  if (currentUserId === targetUserId) {
    throw new Error('Cannot create private chat with yourself');
  }
  
  try {
    // 1. Use deterministic chat ID to avoid expensive lookups
    const sortedUserIds = [currentUserId, targetUserId].sort();
    const deterministicChatId = `private_${sortedUserIds[0]}_${sortedUserIds[1]}`.replace(/[@.]/g, '_');
    
    // 2. Direct lookup for existing private chat (O(1) instead of O(n))
    const existingChat = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_CHATROOM,
      Key: { id: deterministicChatId }
    }));
    
    if (existingChat.Item && existingChat.Item.type === 'private') {
      return existingChat.Item as ChatRoom;
    }
    
    // 3. Verify both users exist (parallel execution)
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
    
    // 4. Create new private chat room with deterministic ID
    const chatRoomId = deterministicChatId;
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
      Item: chatRoom,
      ConditionExpression: 'attribute_not_exists(id)' // Prevent duplicate creation
    }));
    
    // 5. Add both users as members (parallel execution)
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
    
    return chatRoom;
    
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(`Failed to create private chat: ${errorMessage}`);
  }
};