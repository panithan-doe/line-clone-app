import { defineFunction } from '@aws-amplify/backend';

export const userAuth = defineFunction({
  name: 'userAuth',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data',
});