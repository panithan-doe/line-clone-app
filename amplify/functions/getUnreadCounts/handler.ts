import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AppSyncResolverHandler } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface GetUnreadCountsInput {
  userId: string;
  chatRoomIds?: string[];
}

interface UnreadCountsResponse {
  [chatRoomId: string]: number;
}

export const handler: AppSyncResolverHandler<GetUnreadCountsInput, UnreadCountsResponse> = async (event) => {
  const { userId, chatRoomIds } = event.arguments;
  
  if (!userId) {
    throw new Error('Missing required field: userId');
  }
  
  try {
    const unreadCounts: UnreadCountsResponse = {};
    
    // If specific chatRoomIds provided, process those only
    const roomsToProcess = chatRoomIds?.length ? chatRoomIds : [];
    
    // If no specific rooms provided, get all user's chat rooms
    if (!chatRoomIds?.length) {
      const userRoomsResult = await docClient.send(new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE_CHATROOMMEMBER,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      }));
      
      roomsToProcess.push(...(userRoomsResult.Items?.map(item => item.chatRoomId) || []));
    }
    
    // Process each chat room
    for (const chatRoomId of roomsToProcess) {
      try {
        // Get user's last read position for this room
        const memberResult = await docClient.send(new QueryCommand({
          TableName: process.env.DYNAMODB_TABLE_CHATROOMMEMBER,
          IndexName: 'chatRoomId-userId-index',
          KeyConditionExpression: 'chatRoomId = :chatRoomId AND userId = :userId',
          ExpressionAttributeValues: {
            ':chatRoomId': chatRoomId,
            ':userId': userId,
          },
        }));
        
        const member = memberResult.Items?.[0];
        const lastReadAt = member?.lastReadAt;
        
        if (lastReadAt) {
          // Count messages created after lastReadAt that are not from this user
          const messagesResult = await docClient.send(new ScanCommand({
            TableName: process.env.DYNAMODB_TABLE_MESSAGE,
            FilterExpression: 'chatRoomId = :chatRoomId AND createdAt > :lastReadAt AND senderId <> :userId',
            ExpressionAttributeValues: {
              ':chatRoomId': chatRoomId,
              ':lastReadAt': lastReadAt,
              ':userId': userId,
            },
            Select: 'COUNT',
          }));
          
          unreadCounts[chatRoomId] = messagesResult.Count || 0;
        } else {
          // If no lastReadAt, count all messages not from this user
          const messagesResult = await docClient.send(new ScanCommand({
            TableName: process.env.DYNAMODB_TABLE_MESSAGE,
            FilterExpression: 'chatRoomId = :chatRoomId AND senderId <> :userId',
            ExpressionAttributeValues: {
              ':chatRoomId': chatRoomId,
              ':userId': userId,
            },
            Select: 'COUNT',
          }));
          
          unreadCounts[chatRoomId] = messagesResult.Count || 0;
        }
        
      } catch (roomError) {
        console.error(`Error processing room ${chatRoomId}:`, roomError);
        unreadCounts[chatRoomId] = 0;
      }
    }
    
    return unreadCounts;
    
  } catch (error) {
    console.error('Error getting unread counts:', error);
    throw new Error(`Failed to get unread counts: ${(error as Error).message}`);
  }
};