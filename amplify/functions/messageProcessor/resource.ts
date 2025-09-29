import { defineFunction } from '@aws-amplify/backend';

export const messageProcessor = defineFunction({
  name: 'messageProcessor',
  entry: './handler.ts',
  timeoutSeconds: 30, // Keep 30s for batch processing
  memoryMB: 1024, // Increase memory for better performance under high load
  resourceGroupName: 'data', // Assign to data stack to avoid circular dependency
  environment: {
    // Environment variables will be added in backend.ts
  }
});