import { defineFunction } from '@aws-amplify/backend';

export const updateProfileImage = defineFunction({
  name: 'updateProfileImage',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 60,
  memoryMB: 1024,
  resourceGroupName: 'data',
});