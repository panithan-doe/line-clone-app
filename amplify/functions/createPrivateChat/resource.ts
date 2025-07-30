import { defineFunction } from '@aws-amplify/backend';

export const createPrivateChat = defineFunction({
  name: 'createPrivateChat',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data',
});