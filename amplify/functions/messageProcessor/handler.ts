// Worker Lambda to process messages from SQS and call AppSync mutations
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SQSEvent, SQSHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// AppSync GraphQL mutations
const CREATE_MESSAGE_MUTATION = `
  mutation CreateMessage($input: CreateMessageInput!) {
    createMessage(input: $input) {
      id
      content
      type
      chatRoomId
      senderId
      senderNickname
      isRead
      createdAt
      updatedAt
      __typename
    }
  }
`;

const UPDATE_CHATROOM_MUTATION = `
  mutation UpdateChatRoom($input: UpdateChatRoomInput!) {
    updateChatRoom(input: $input) {
      id
      lastMessage
      lastMessageAt
      __typename
    }
  }
`;

// Function to make signed AppSync GraphQL requests
async function callAppSyncMutation(query: string, variables: any) {
  const AWS = require('aws-sdk');
  
  const endpoint = process.env.APPSYNC_ENDPOINT;
  const region = process.env.AWS_REGION;
  
  if (!endpoint) {
    throw new Error('APPSYNC_ENDPOINT environment variable not set');
  }

  // Create HTTP request
  const uri = new URL(endpoint);
  const httpRequest = new AWS.HttpRequest(endpoint, region);
  httpRequest.headers.host = uri.host;
  httpRequest.headers['Content-Type'] = 'application/json';
  httpRequest.method = 'POST';
  httpRequest.body = JSON.stringify({ query, variables });

  // Sign the request
  const credentials = new AWS.EnvironmentCredentials('AWS');
  const signer = new AWS.Signers.V4(httpRequest, 'appsync', true);
  signer.addAuthorization(credentials, AWS.util.date.getDate());

  // Make the request
  const response = await fetch(endpoint, {
    method: httpRequest.method,
    body: httpRequest.body,
    headers: httpRequest.headers,
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`AppSync GraphQL errors: ${JSON.stringify(result.errors)}`);
  }
  
  return result.data;
}


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
      
      // 1. Create message via AppSync GraphQL (this will trigger subscriptions)
      try {
        const createMessageInput = {
          id: messageId,
          chatRoomId: messagePayload.chatRoomId,
          content: messagePayload.content,
          type: messagePayload.type || 'text',
          senderId: messagePayload.senderId,
          senderNickname: messagePayload.senderNickname,
          isRead: false
        };

        const result = await callAppSyncMutation(CREATE_MESSAGE_MUTATION, {
          input: createMessageInput
        });
        
        console.log(`✅ Message created via AppSync GraphQL: ${messageId}`, result.createMessage);
      } catch (graphqlError) {
        console.error(`❌ AppSync GraphQL mutation failed for ${messageId}:`, graphqlError);
        
        // Fallback: Direct DynamoDB write if GraphQL fails
        console.log('⚠️ Falling back to direct DynamoDB write');
        await docClient.send(new PutCommand({
          TableName: process.env.DYNAMODB_TABLE_MESSAGE,
          Item: message,
          ConditionExpression: 'attribute_not_exists(id)'
        }));
        
        console.log(`✅ Message saved to DynamoDB (fallback): ${messageId}`);
      }
      
      // 2. Update chat room last message info via AppSync GraphQL
      try {
        const updateChatRoomInput = {
          id: messagePayload.chatRoomId,
          lastMessage: messagePayload.content,
          lastMessageAt: now
        };

        const result = await callAppSyncMutation(UPDATE_CHATROOM_MUTATION, {
          input: updateChatRoomInput
        });
        
        console.log(`✅ Updated chat room via AppSync GraphQL: ${messagePayload.chatRoomId}`, result.updateChatRoom);
      } catch (updateError) {
        console.error(`❌ ChatRoom AppSync update failed, using DynamoDB fallback:`, updateError);
        
        // Fallback: Direct DynamoDB update
        await docClient.send(new UpdateCommand({
          TableName: process.env.DYNAMODB_TABLE_CHATROOM,
          Key: { id: messagePayload.chatRoomId },
          UpdateExpression: 'SET lastMessage = :content, lastMessageAt = :timestamp',
          ExpressionAttributeValues: {
            ':content': messagePayload.content,
            ':timestamp': now
          }
        }));
        
        console.log(`✅ Updated chat room via DynamoDB fallback: ${messagePayload.chatRoomId}`);
      }
      
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