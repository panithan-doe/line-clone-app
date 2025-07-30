import { defineBackend } from '@aws-amplify/backend';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sendMessage } from './functions/sendMessage/resource';
import { createPrivateChat } from './functions/createPrivateChat/resource';
import { createGroupChat } from './functions/createGroupChat/resource';
import { updateProfileImage } from './functions/updateProfileImage/resource';
import { userAuth } from './functions/userAuth/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  sendMessage,
  createPrivateChat,
  createGroupChat,
  updateProfileImage,
  userAuth
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