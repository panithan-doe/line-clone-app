// Worker Lambda to process messages from SQS and store in DynamoDB
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SQSEvent, SQSHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface MessagePayload {
  chatRoomId: string;
  content: string;
  type: string;
  senderId: string;
  senderNickname: string;
  messageId?: string;
  timestamp?: string;
}

interface ProcessedMessage {
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

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  console.log(`🔄 Processing ${event.Records.length} messages from SQS`);
  
  const results = [];
  
  for (const record of event.Records) {
    try {
      const messagePayload: MessagePayload = JSON.parse(record.body);
      console.log(`📤 Processing message for chat room: ${messagePayload.chatRoomId}`);
      
      // Validate required fields
      if (!messagePayload.chatRoomId || !messagePayload.content || 
          !messagePayload.senderId || !messagePayload.senderNickname) {
        throw new Error('Missing required fields in message payload');
      }
      
      const messageId = messagePayload.messageId || randomUUID();
      const now = messagePayload.timestamp || new Date().toISOString();
      
      const message: ProcessedMessage = {
        id: messageId,
        chatRoomId: messagePayload.chatRoomId,
        content: messagePayload.content,
        type: messagePayload.type || 'text',
        senderId: messagePayload.senderId,
        senderNickname: messagePayload.senderNickname,
        isRead: false,
        createdAt: now,
        updatedAt: now
      };
      
      // 1. Save message to DynamoDB
      await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_MESSAGE,
        Item: message,
        // Prevent duplicate messages with conditional put
        ConditionExpression: 'attribute_not_exists(id)'
      }));
      
      console.log(`✅ Message saved to DynamoDB: ${messageId}`);
      
      // 2. Update chat room last message info
      await docClient.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_TABLE_CHATROOM,
        Key: { id: messagePayload.chatRoomId },
        UpdateExpression: 'SET lastMessage = :content, lastMessageAt = :timestamp',
        ExpressionAttributeValues: {
          ':content': messagePayload.content,
          ':timestamp': now
        }
      }));
      
      console.log(`✅ Updated chat room: ${messagePayload.chatRoomId}`);
      
      results.push({
        messageId,
        status: 'success',
        sqsMessageId: record.messageId
      });
      
    } catch (error) {
      console.error(`❌ Failed to process SQS message ${record.messageId}:`, error);
      
      results.push({
        messageId: record.messageId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        sqsMessageId: record.messageId
      });
      
      // For SQS, throwing an error will cause the message to be retried
      // If we don't want retry, we can choose to not throw here
      throw error; // This will send message to DLQ after maxReceiveCount attempts
    }
  }
  
  console.log(`🏁 Processed ${results.length} messages. Success: ${results.filter(r => r.status === 'success').length}, Failed: ${results.filter(r => r.status === 'failed').length}`);
  
  // SQSHandler doesn't return anything - just processes messages
};