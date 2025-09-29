import { defineFunction } from '@aws-amplify/backend';

export const sendMessage = defineFunction({
  name: 'sendMessage',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 15, // Reduce timeout for faster API response
  memoryMB: 1024, // Increase memory for better performance under high load
  resourceGroupName: 'data',
});