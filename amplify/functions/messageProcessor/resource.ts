import { defineFunction } from '@aws-amplify/backend';

export const messageProcessor = defineFunction({
  name: 'messageProcessor',
  entry: './handler.ts',
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data', // Assign to data stack to avoid circular dependency
  environment: {
    // Environment variables will be added in backend.ts
  }
});