import { defineBackend } from '@aws-amplify/backend';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { pushNotification } from './functions/push-notification/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  pushNotification
});

// Configure DynamoDB Stream trigger for push notifications
backend.pushNotification.resources.lambda.addEventSource(
  new DynamoEventSource(backend.data.resources.tables["Message"], {
    startingPosition: StartingPosition.LATEST
  })
);