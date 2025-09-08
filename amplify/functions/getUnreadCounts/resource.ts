import { defineFunction } from '@aws-amplify/backend';

export const getUnreadCounts = defineFunction({
  // resourceGroupName: 'data',
  environment: {
    DYNAMODB_TABLE_CHATROOMMEMBER: process.env.DYNAMODB_TABLE_CHATROOMMEMBER || '',
    DYNAMODB_TABLE_MESSAGE: process.env.DYNAMODB_TABLE_MESSAGE || '',
  },
});