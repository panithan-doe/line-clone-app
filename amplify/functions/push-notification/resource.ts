import { defineFunction } from '@aws-amplify/backend';

export const pushNotification = defineFunction({
  name: 'push-notification',
  entry: './handler.ts',
  environment: {
    // Add any environment variables if needed
  },
  runtime: 18,
  timeoutSeconds: 30,
  memoryMB: 512,
});