import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { CfnUserPoolClient } from 'aws-cdk-lib/aws-cognito';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Duration } from 'aws-cdk-lib';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sendMessage } from './functions/sendMessage/resource';
import { createPrivateChat } from './functions/createPrivateChat/resource';
import { createGroupChat } from './functions/createGroupChat/resource';
import { updateProfileImage } from './functions/updateProfileImage/resource';
import { userAuth } from './functions/userAuth/resource';
import { messageProcessor } from './functions/messageProcessor/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  sendMessage,
  createPrivateChat,
  createGroupChat,
  updateProfileImage,
  userAuth,
  messageProcessor
});


// Grant Lambda functions access to DynamoDB tables
backend.sendMessage.addEnvironment('DYNAMODB_TABLE_MESSAGE', backend.data.resources.tables["Message"].tableName);
backend.sendMessage.addEnvironment('DYNAMODB_TABLE_CHATROOM', backend.data.resources.tables["ChatRoom"].tableName);
backend.sendMessage.addEnvironment('DYNAMODB_TABLE_CHATROOMEMBER', backend.data.resources.tables["ChatRoomMember"].tableName);

backend.createPrivateChat.addEnvironment('DYNAMODB_TABLE_CHATROOM', backend.data.resources.tables["ChatRoom"].tableName);
backend.createPrivateChat.addEnvironment('DYNAMODB_TABLE_CHATROOMEMBER', backend.data.resources.tables["ChatRoomMember"].tableName);
backend.createPrivateChat.addEnvironment('DYNAMODB_TABLE_USER', backend.data.resources.tables["User"].tableName);

backend.createGroupChat.addEnvironment('DYNAMODB_TABLE_CHATROOM', backend.data.resources.tables["ChatRoom"].tableName);
backend.createGroupChat.addEnvironment('DYNAMODB_TABLE_CHATROOMEMBER', backend.data.resources.tables["ChatRoomMember"].tableName);
backend.createGroupChat.addEnvironment('DYNAMODB_TABLE_USER', backend.data.resources.tables["User"].tableName);

backend.updateProfileImage.addEnvironment('DYNAMODB_TABLE_USER', backend.data.resources.tables["User"].tableName);
backend.updateProfileImage.addEnvironment('S3_BUCKET_NAME', backend.storage.resources.bucket.bucketName);

backend.userAuth.addEnvironment('DYNAMODB_TABLE_USER', backend.data.resources.tables["User"].tableName);
backend.userAuth.addEnvironment('USER_POOL_ID', backend.auth.resources.userPool.userPoolId);

backend.messageProcessor.addEnvironment('DYNAMODB_TABLE_MESSAGE', backend.data.resources.tables["Message"].tableName);
backend.messageProcessor.addEnvironment('DYNAMODB_TABLE_CHATROOM', backend.data.resources.tables["ChatRoom"].tableName);

// Grant Lambda functions permissions to access DynamoDB tables
backend.data.resources.tables["Message"].grantReadWriteData(backend.sendMessage.resources.lambda);
backend.data.resources.tables["ChatRoom"].grantReadWriteData(backend.sendMessage.resources.lambda);
backend.data.resources.tables["ChatRoomMember"].grantReadWriteData(backend.sendMessage.resources.lambda);

// Grant additional permissions for secondary indexes
backend.sendMessage.resources.lambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['dynamodb:Query'],
  resources: [
    `${backend.data.resources.tables["ChatRoomMember"].tableArn}/index/*`
  ]
}));

backend.data.resources.tables["ChatRoom"].grantReadWriteData(backend.createPrivateChat.resources.lambda);
backend.data.resources.tables["ChatRoomMember"].grantReadWriteData(backend.createPrivateChat.resources.lambda);
backend.data.resources.tables["User"].grantReadData(backend.createPrivateChat.resources.lambda);

// Grant createPrivateChat permissions for secondary indexes
backend.createPrivateChat.resources.lambda.addToRolePolicy(new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['dynamodb:Query'],
  resources: [
    `${backend.data.resources.tables["ChatRoomMember"].tableArn}/index/*`
  ]
}));

backend.data.resources.tables["ChatRoom"].grantReadWriteData(backend.createGroupChat.resources.lambda);
backend.data.resources.tables["ChatRoomMember"].grantReadWriteData(backend.createGroupChat.resources.lambda);
backend.data.resources.tables["User"].grantReadData(backend.createGroupChat.resources.lambda);

backend.data.resources.tables["User"].grantReadWriteData(backend.updateProfileImage.resources.lambda);
backend.storage.resources.bucket.grantReadWrite(backend.updateProfileImage.resources.lambda);

backend.data.resources.tables["User"].grantReadWriteData(backend.userAuth.resources.lambda);
backend.auth.resources.userPool.grant(backend.userAuth.resources.lambda, 'cognito-idp:AdminGetUser');

backend.data.resources.tables["Message"].grantReadWriteData(backend.messageProcessor.resources.lambda);
backend.data.resources.tables["ChatRoom"].grantReadWriteData(backend.messageProcessor.resources.lambda);

// Enable USER_PASSWORD_AUTH flow for load testing
const userPoolClient = backend.auth.resources.userPoolClient.node.defaultChild as CfnUserPoolClient;
if (userPoolClient) {
  userPoolClient.addPropertyOverride('ExplicitAuthFlows', [
    'ALLOW_USER_PASSWORD_AUTH',
    'ALLOW_USER_SRP_AUTH',
    'ALLOW_REFRESH_TOKEN_AUTH'
  ]);
}

// Add DynamoDB permissions to postConfirmation trigger (CDK escape hatch)
const postConfirmationLambda = backend.auth.resources.userPool.node.tryFindChild('PostConfirmation');
if (postConfirmationLambda && postConfirmationLambda instanceof Function) {
  // Grant permissions to list tables and access User table
  postConfirmationLambda.addToRolePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:ListTables',
      'dynamodb:PutItem',
      'dynamodb:GetItem'
    ],
    resources: ['*'] // Allow access to all DynamoDB tables for listing and specific operations
  }));
  
  console.log('✅ Added DynamoDB permissions to postConfirmation trigger');
}

// Create a new custom stack for SQS that depends on data
const sqsStack = backend.createStack('SqsStack');

// Create Dead Letter Queue first
const messageDLQ = new sqs.Queue(sqsStack, 'MessageDLQ', {
  queueName: 'line-clone-message-dlq',
  retentionPeriod: Duration.days(14),
  encryption: sqs.QueueEncryption.SQS_MANAGED
});

// Create main message processing queue with DLQ (Standard queue for simplicity)
const messageQueue = new sqs.Queue(sqsStack, 'MessageQueue', {
  queueName: 'line-clone-message-queue',
  visibilityTimeout: Duration.seconds(30), // 6x Lambda timeout
  retentionPeriod: Duration.days(14),
  encryption: sqs.QueueEncryption.SQS_MANAGED,
  deadLetterQueue: {
    queue: messageDLQ,
    maxReceiveCount: 3 // Retry 3 times before moving to DLQ
  }
});

// Connect SQS Queue to messageProcessor Lambda
backend.messageProcessor.resources.lambda.addEventSource(
  new lambdaEventSources.SqsEventSource(messageQueue, {
    batchSize: 10, // Process up to 10 messages at once
    maxBatchingWindow: Duration.seconds(5), // Wait max 5 seconds to collect batch
    reportBatchItemFailures: true // Enable partial batch failure reporting
  })
);

// Grant SQS permissions to messageProcessor Lambda
messageQueue.grantConsumeMessages(backend.messageProcessor.resources.lambda);
messageDLQ.grantConsumeMessages(backend.messageProcessor.resources.lambda);

// Grant SQS send permissions to sendMessage Lambda and add environment variable
messageQueue.grantSendMessages(backend.sendMessage.resources.lambda);
backend.sendMessage.addEnvironment('SQS_MESSAGE_QUEUE_URL', messageQueue.queueUrl);

// Store queue references for Lambda functions to access
export const queueResources = {
  messageQueue,
  messageDLQ
};

console.log('✅ Created SQS Message Queue and DLQ with Lambda trigger');