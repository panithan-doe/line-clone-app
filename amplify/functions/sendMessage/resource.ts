import { defineFunction } from '@aws-amplify/backend';

export const sendMessage = defineFunction({
  name: 'sendMessage',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data',
});