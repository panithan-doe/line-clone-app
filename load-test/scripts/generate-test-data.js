#!/usr/bin/env node

/**
 * Pre-test data generation script
 * Creates 100 test users and 50 chat rooms in DynamoDB for load testing
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});
const docClient = DynamoDBDocumentClient.from(client);

const USER_TABLE_NAME = process.env.USER_TABLE_NAME;
const CHAT_ROOM_TABLE_NAME = process.env.CHAT_ROOM_TABLE_NAME;
const CHAT_ROOM_MEMBER_TABLE_NAME = process.env.CHAT_ROOM_MEMBER_TABLE_NAME;

async function generateTestUsers(count = 100) {
  console.log(`Generating ${count} test users...`);
  
  const users = [];
  for (let i = 0; i < count; i++) {
    const userId = uuidv4();
    const email = `testuser${i + 1}@loadtest.com`;
    const nickname = `TestUser${i + 1}`;
    
    users.push({
      id: userId,
      email,
      nickname,
      avatar: `https://via.placeholder.com/40?text=${nickname[0]}`,
      description: `Load test user ${i + 1}`,
      owner: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Batch write users in chunks of 25 (DynamoDB limit)
  const chunks = [];
  for (let i = 0; i < users.length; i += 25) {
    chunks.push(users.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const writeRequests = chunk.map(user => ({
      PutRequest: {
        Item: user
      }
    }));

    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [USER_TABLE_NAME]: writeRequests
      }
    }));
    
    console.log(`Created ${chunk.length} users`);
  }

  console.log(`Successfully created ${users.length} test users`);
  return users;
}

async function generateTestChatRooms(users, count = 50) {
  console.log(`Generating ${count} chat rooms...`);
  
  const chatRooms = [];
  const chatRoomMembers = [];
  
  for (let i = 0; i < count; i++) {
    const chatRoomId = uuidv4();
    const isGroupChat = i % 3 === 0; // Every 3rd room is a group chat
    const roomName = isGroupChat ? `Group Chat ${i + 1}` : `Private Chat ${i + 1}`;
    
    const chatRoom = {
      id: chatRoomId,
      name: roomName,
      type: isGroupChat ? 'group' : 'private',
      description: isGroupChat ? `Load test group chat room ${i + 1}` : null,
      avatar: isGroupChat ? `https://via.placeholder.com/40?text=G${i + 1}` : null,
      lastMessage: 'Welcome to the chat!',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    chatRooms.push(chatRoom);
    
    // Add members to chat room
    const memberCount = isGroupChat ? Math.floor(Math.random() * 8) + 3 : 2; // Group: 3-10 members, Private: 2 members
    const selectedUsers = users.slice(0, memberCount);
    
    for (const user of selectedUsers) {
      const member = {
        id: uuidv4(),
        chatRoomId: chatRoomId,
        userId: user.id,
        userNickname: user.nickname,
        role: 'member',
        joinedAt: new Date().toISOString()
      };
      chatRoomMembers.push(member);
    }
  }

  // Batch write chat rooms
  const roomChunks = [];
  for (let i = 0; i < chatRooms.length; i += 25) {
    roomChunks.push(chatRooms.slice(i, i + 25));
  }

  for (const chunk of roomChunks) {
    const writeRequests = chunk.map(room => ({
      PutRequest: {
        Item: room
      }
    }));

    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [CHAT_ROOM_TABLE_NAME]: writeRequests
      }
    }));
    
    console.log(`Created ${chunk.length} chat rooms`);
  }

  // Batch write chat room members
  const memberChunks = [];
  for (let i = 0; i < chatRoomMembers.length; i += 25) {
    memberChunks.push(chatRoomMembers.slice(i, i + 25));
  }

  for (const chunk of memberChunks) {
    const writeRequests = chunk.map(member => ({
      PutRequest: {
        Item: member
      }
    }));

    await docClient.send(new BatchWriteCommand({
      RequestItems: {
        [CHAT_ROOM_MEMBER_TABLE_NAME]: writeRequests
      }
    }));
    
    console.log(`Created ${chunk.length} chat room memberships`);
  }

  console.log(`Successfully created ${chatRooms.length} chat rooms with ${chatRoomMembers.length} memberships`);
  return { chatRooms, chatRoomMembers };
}

async function saveTestDataToFile(users, chatRooms, chatRoomMembers) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const testData = {
    users: users.slice(0, 20), // Save first 20 users for easy access in tests
    chatRooms: chatRooms.slice(0, 10), // Save first 10 rooms for easy access in tests
    chatRoomMembers: chatRoomMembers.filter(member => 
      chatRooms.slice(0, 10).some(room => room.id === member.chatRoomId)
    ),
    timestamp: new Date().toISOString()
  };
  
  const outputPath = path.join(__dirname, '../data/test-data.json');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(testData, null, 2));
  
  console.log(`Test data saved to ${outputPath}`);
  return testData;
}

async function main() {
  try {
    if (!USER_TABLE_NAME || !CHAT_ROOM_TABLE_NAME || !CHAT_ROOM_MEMBER_TABLE_NAME) {
      console.error('Missing required environment variables:');
      console.error('- USER_TABLE_NAME');
      console.error('- CHAT_ROOM_TABLE_NAME');
      console.error('- CHAT_ROOM_MEMBER_TABLE_NAME');
      process.exit(1);
    }

    console.log('Starting test data generation...');
    console.log('Environment:', {
      region: process.env.AWS_REGION || 'us-east-1',
      userTable: USER_TABLE_NAME,
      chatRoomTable: CHAT_ROOM_TABLE_NAME,
      memberTable: CHAT_ROOM_MEMBER_TABLE_NAME
    });

    // Generate test data
    const users = await generateTestUsers(100);
    const { chatRooms, chatRoomMembers } = await generateTestChatRooms(users, 50);
    
    // Save subset for easy access in tests
    await saveTestDataToFile(users, chatRooms, chatRoomMembers);
    
    console.log('Test data generation completed successfully!');
    console.log('Summary:');
    console.log(`- Created ${users.length} test users`);
    console.log(`- Created ${chatRooms.length} chat rooms`);
    console.log(`- Created ${chatRoomMembers.length} chat room memberships`);
    
  } catch (error) {
    console.error('Error generating test data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { generateTestUsers, generateTestChatRooms, saveTestDataToFile };