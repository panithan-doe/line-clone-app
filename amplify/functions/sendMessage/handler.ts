import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { AppSyncResolverEvent, AppSyncResolverHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface SendMessageInput {
  chatRoomId: string;
  content: string;
  type?: string;
  senderId: string;
  senderNickname: string;
}

interface Message {
  id: string;
  chatRoomId: string;
  content: string;
  type: string;
  senderId: string;
  senderNickname: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export const handler: AppSyncResolverHandler<SendMessageInput, Message> = async (event) => {
  console.log('Send message event:', JSON.stringify(event, null, 2));
  
  const { chatRoomId, content, type = 'text', senderId, senderNickname } = event.arguments;
  
  if (!chatRoomId || !content || !senderId || !senderNickname) {
    throw new Error('Missing required fields: chatRoomId, content, senderId, senderNickname');
  }
  
  const messageId = randomUUID();
  const now = new Date().toISOString();
  
  const message: Message = {
    id: messageId,
    chatRoomId,
    content,
    type,
    senderId,
    senderNickname,
    isRead: false,
    createdAt: now,
    updatedAt: now
  };
  
  try {
    // 1. Verify user is a member of the chat room
    const membership = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_CHATROOMEMBER,
      IndexName: 'chatRoomId-userId-index',
      KeyConditionExpression: 'chatRoomId = :chatRoomId AND userId = :userId',
      ExpressionAttributeValues: {
        ':chatRoomId': chatRoomId,
        ':userId': senderId
      }
    }));
    
    if (!membership.Items || membership.Items.length === 0) {
      throw new Error('User is not a member of this chat room');
    }
    
    // 2. Save the message directly to DynamoDB (for immediate response)
    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_MESSAGE,
      Item: message
    }));
    
    // 3. Update chat room with last message info
    await docClient.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_TABLE_CHATROOM,
      Key: { id: chatRoomId },
      UpdateExpression: 'SET lastMessage = :content, lastMessageAt = :timestamp',
      ExpressionAttributeValues: {
        ':content': content,
        ':timestamp': now
      }
    }));

    // 4. Trigger subscription by creating the message again through AppSync
    // This is a workaround to trigger GraphQL subscriptions
    try {
      // Note: In a real implementation, we would use AppSync's internal GraphQL client
      // For now, we'll rely on the frontend to handle the subscription triggering
      console.log('Message created via DynamoDB, subscriptions may not be triggered automatically');
    } catch (subscriptionError) {
      console.error('Error triggering subscription:', subscriptionError);
      // Don't fail the whole operation if subscription fails
    }
    
    console.log('Message sent successfully:', messageId);
    return message;
    
  } catch (error) {
    console.error('Error sending message:', error);
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(`Failed to send message: ${errorMessage}`);
  }
};