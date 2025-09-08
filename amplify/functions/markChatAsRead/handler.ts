import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { AppSyncResolverHandler } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

interface MarkChatAsReadInput {
  chatRoomId: string;
  userId: string;
  lastMessageId?: string;
}

interface ChatRoomMemberResponse {
  id: string;
  chatRoomId: string;
  userId: string;
  userNickname: string;
  role: string;
  lastReadMessageId?: string;
  lastReadAt?: string;
  updatedAt: string;
}

export const handler: AppSyncResolverHandler<MarkChatAsReadInput, ChatRoomMemberResponse> = async (event) => {
  const { chatRoomId, userId, lastMessageId } = event.arguments;
  
  if (!chatRoomId || !userId) {
    throw new Error('Missing required fields: chatRoomId, userId');
  }
  
  try {
    const now = new Date().toISOString();
    
    // Find the ChatRoomMember record
    const queryResult = await docClient.send(new QueryCommand({
      TableName: process.env.DYNAMODB_TABLE_CHATROOMMEMBER,
      IndexName: 'chatRoomId-userId-index',
      KeyConditionExpression: 'chatRoomId = :chatRoomId AND userId = :userId',
      ExpressionAttributeValues: {
        ':chatRoomId': chatRoomId,
        ':userId': userId,
      },
    }));
    
    const member = queryResult.Items?.[0];
    if (!member) {
      throw new Error(`ChatRoomMember not found for user ${userId} in chat ${chatRoomId}`);
    }
    
    // Update the member's last read position
    const updateParams: any = {
      TableName: process.env.DYNAMODB_TABLE_CHATROOMMEMBER,
      Key: { id: member.id },
      UpdateExpression: 'SET lastReadAt = :lastReadAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':lastReadAt': now,
        ':updatedAt': now,
      },
      ReturnValues: 'ALL_NEW',
    };
    
    // If lastMessageId is provided, update it too
    if (lastMessageId) {
      updateParams.UpdateExpression += ', lastReadMessageId = :lastReadMessageId';
      updateParams.ExpressionAttributeValues[':lastReadMessageId'] = lastMessageId;
    }
    
    const updateResult = await docClient.send(new UpdateCommand(updateParams));
    
    return updateResult.Attributes as ChatRoomMemberResponse;
    
  } catch (error) {
    console.error('Error marking chat as read:', error);
    throw new Error(`Failed to mark chat as read: ${(error as Error).message}`);
  }
};