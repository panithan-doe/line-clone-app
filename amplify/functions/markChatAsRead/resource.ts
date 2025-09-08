import { defineFunction } from '@aws-amplify/backend';

export const markChatAsRead = defineFunction({
  // resourceGroupName: 'data',
  environment: {
    DYNAMODB_TABLE_CHATROOMMEMBER: process.env.DYNAMODB_TABLE_CHATROOMMEMBER || '',
  },
});