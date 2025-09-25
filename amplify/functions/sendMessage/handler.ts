import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { AppSyncResolverEvent, AppSyncResolverHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({});

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
  console.log('🚨🚨🚨 SENDMESSAGE LAMBDA CALLED! 🚨🚨🚨');
  console.log('📤 Received sendMessage request:', JSON.stringify(event, null, 2));
  console.log('⏰ Timestamp:', new Date().toISOString());
  
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
    
    // 2. Send message to SQS Queue for async processing
    const messagePayload = {
      chatRoomId,
      content,
      type,
      senderId,
      senderNickname,
      messageId,
      timestamp: now
    };
    
    if (process.env.SQS_MESSAGE_QUEUE_URL) {
      console.log('📤 Sending message to SQS queue for async processing');
      
      // ยิง message เข้า SQS
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.SQS_MESSAGE_QUEUE_URL,
        MessageBody: JSON.stringify(messagePayload),
        // Remove FIFO-specific attributes for now to simplify deployment
        MessageAttributes: {
          ChatRoomId: {
            DataType: 'String',
            StringValue: chatRoomId
          },
          MessageId: {
            DataType: 'String', 
            StringValue: messageId
          }
        }
      }));
      
      console.log('✅ Message sent to SQS successfully');
    } else {
      // Fallback: Direct database save if SQS is not configured
      console.log('⚠️ SQS not configured, falling back to direct database save');
      
      await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_MESSAGE,
        Item: message
      }));
      
      await docClient.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_TABLE_CHATROOM,
        Key: { id: chatRoomId },
        UpdateExpression: 'SET lastMessage = :content, lastMessageAt = :timestamp',
        ExpressionAttributeValues: {
          ':content': content,
          ':timestamp': now
        }
      }));
    }
    
    return message;
    
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(`Failed to send message: ${errorMessage}`);
  }
};