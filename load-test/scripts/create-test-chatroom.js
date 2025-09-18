import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-1",
});
const docClient = DynamoDBDocumentClient.from(client);

// Configuration
const CHATROOM_TABLE_NAME = process.env.CHATROOM_TABLE_NAME || "ChatRoom";
const CHATROOM_MEMBER_TABLE_NAME = process.env.CHATROOM_MEMBER_TABLE_NAME || "ChatRoomMember";
const TOTAL_USERS = 100;

// Generate a unique chat room ID
const CHAT_ROOM_ID = `load-test-group-${Date.now()}`;

async function createTestChatRoom() {
  const now = new Date().toISOString();
  
  const chatRoomItem = {
    id: CHAT_ROOM_ID,
    name: "Load Test Group Chat",
    type: "group",
    description: "Group chat for load testing with 100 members",
    avatar: null,
    lastMessage: "",
    lastMessageAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const command = new PutCommand({
      TableName: CHATROOM_TABLE_NAME,
      Item: chatRoomItem,
      ConditionExpression: "attribute_not_exists(id)",
    });

    await docClient.send(command);
    console.log(`✅ Created chat room: ${chatRoomItem.name} (ID: ${CHAT_ROOM_ID})`);
    return { success: true, chatRoomId: CHAT_ROOM_ID };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.log(`⚠️  Chat room already exists: ${CHAT_ROOM_ID}`);
      return { success: false, chatRoomId: CHAT_ROOM_ID, reason: "already_exists" };
    } else {
      console.error(`❌ Failed to create chat room:`, error.message);
      return { success: false, chatRoomId: CHAT_ROOM_ID, reason: error.message };
    }
  }
}

async function createChatRoomMember(userNumber, chatRoomId) {
  const email = `testuser${userNumber}@loadtest.com`;
  const nickname = `TestUser${userNumber}`;
  const now = new Date().toISOString();
  
  const memberItem = {
    id: `${chatRoomId}-${email}`, // Composite ID
    chatRoomId: chatRoomId,
    userId: email,
    userNickname: nickname,
    role: userNumber === 1 ? "admin" : "member", // First user is admin
    joinedAt: now,
    lastReadMessageId: null,
    lastReadAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const command = new PutCommand({
      TableName: CHATROOM_MEMBER_TABLE_NAME,
      Item: memberItem,
      ConditionExpression: "attribute_not_exists(id)",
    });

    await docClient.send(command);
    console.log(`✅ Added member: ${email} (${userNumber === 1 ? 'Admin' : 'Member'})`);
    return { success: true, email, role: memberItem.role };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.log(`⚠️  Member already exists: ${email}`);
      return { success: false, email, reason: "already_exists" };
    } else {
      console.error(`❌ Failed to add member ${email}:`, error.message);
      return { success: false, email, reason: error.message };
    }
  }
}

async function createTestChatRoomAndMembers() {
  console.log(`🚀 Starting creation of test chat room with ${TOTAL_USERS} members...`);
  console.log(`🏠 ChatRoom Table: ${CHATROOM_TABLE_NAME}`);
  console.log(`👥 ChatRoomMember Table: ${CHATROOM_MEMBER_TABLE_NAME}`);
  console.log(`🆔 Chat Room ID: ${CHAT_ROOM_ID}`);
  console.log("─".repeat(50));

  // Step 1: Create the chat room
  console.log("📝 Step 1: Creating chat room...");
  const chatRoomResult = await createTestChatRoom();
  
  if (!chatRoomResult.success && chatRoomResult.reason !== "already_exists") {
    console.error("❌ Failed to create chat room. Aborting.");
    return;
  }
  
  // Step 2: Create chat room members
  console.log(`\n👥 Step 2: Adding ${TOTAL_USERS} members to chat room...`);
  const memberResults = [];
  const batchSize = 10;

  for (let i = 0; i < TOTAL_USERS; i += batchSize) {
    const batch = [];
    const endIndex = Math.min(i + batchSize, TOTAL_USERS);
    
    console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}: Members ${i + 1}-${endIndex}`);
    
    // Create promises for current batch
    for (let j = i + 1; j <= endIndex; j++) {
      batch.push(createChatRoomMember(j, CHAT_ROOM_ID));
    }

    // Wait for all promises in current batch to complete
    const batchResults = await Promise.allSettled(batch);
    
    // Process results
    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        memberResults.push(result.value);
      } else {
        const userNumber = i + index + 1;
        console.error(`❌ Batch error for user ${userNumber}:`, result.reason);
        memberResults.push({ 
          success: false, 
          email: `testuser${userNumber}@loadtest.com`, 
          reason: result.reason 
        });
      }
    });

    // Small delay between batches
    if (endIndex < TOTAL_USERS) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 CHAT ROOM CREATION SUMMARY");
  console.log("=".repeat(50));
  
  const successfulMembers = memberResults.filter(r => r.success).length;
  const failedMembers = memberResults.filter(r => !r.success).length;
  const alreadyExistMembers = memberResults.filter(r => r.reason === "already_exists").length;
  const adminMembers = memberResults.filter(r => r.success && r.role === "admin").length;
  
  console.log(`🏠 Chat Room: "${chatRoomResult.success ? 'Created' : 'Already existed'}" (ID: ${CHAT_ROOM_ID})`);
  console.log(`✅ Successfully added: ${successfulMembers} members`);
  console.log(`⚠️  Already existed: ${alreadyExistMembers} members`);
  console.log(`❌ Failed: ${failedMembers - alreadyExistMembers} members`);
  console.log(`👑 Admin members: ${adminMembers}`);
  console.log(`👤 Regular members: ${successfulMembers - adminMembers}`);
  console.log(`📈 Total processed: ${memberResults.length} members`);

  // Show failed members (excluding already exists)
  const realFailures = memberResults.filter(r => !r.success && r.reason !== "already_exists");
  if (realFailures.length > 0) {
    console.log("\n❌ Failed members:");
    realFailures.forEach(failure => {
      console.log(`   ${failure.email}: ${failure.reason}`);
    });
  }

  console.log("\n📋 Chat Room Details:");
  console.log(`   Name: Load Test Group Chat`);
  console.log(`   Type: group`);
  console.log(`   ID: ${CHAT_ROOM_ID}`);
  console.log(`   Members: testuser1@loadtest.com (admin) to testuser${TOTAL_USERS}@loadtest.com`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestChatRoomAndMembers()
    .then(() => {
      console.log("\n🎉 Chat room creation script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Script failed:", error);
      process.exit(1);
    });
}

export { createTestChatRoomAndMembers, createTestChatRoom, createChatRoomMember };