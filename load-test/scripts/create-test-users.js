import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

// Configuration
const OWNER_EMAIL = "testuser@loadtest.com";
const TABLE_NAME = process.env.USER_TABLE_NAME || "User"; // Update this with your actual table name
const TOTAL_USERS = 100;

async function createTestUser(userNumber) {
  const email = `testuser${userNumber}@loadtest.com`;
  const nickname = `TestUser${userNumber}`;
  const now = new Date().toISOString();
  
  const userItem = {
    id: `testuser${userNumber}`, // Using email prefix as ID
    email: email,
    nickname: nickname,
    owner: OWNER_EMAIL,
    description: `Load test user ${userNumber}`,
    avatar: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: userItem,
      ConditionExpression: "attribute_not_exists(email)", // Prevent overwriting existing users
    });

    await docClient.send(command);
    console.log(`✅ Created user: ${email}`);
    return { success: true, email };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      console.log(`⚠️  User already exists: ${email}`);
      return { success: false, email, reason: "already_exists" };
    } else {
      console.error(`❌ Failed to create user ${email}:`, error.message);
      return { success: false, email, reason: error.message };
    }
  }
}

async function createAllTestUsers() {
  console.log(`🚀 Starting creation of ${TOTAL_USERS} test users...`);
  console.log(`📧 Owner: ${OWNER_EMAIL}`);
  console.log(`🗃️  Table: ${TABLE_NAME}`);
  console.log("─".repeat(50));

  const results = [];
  const batchSize = 10; // Process in batches to avoid overwhelming DynamoDB

  for (let i = 0; i < TOTAL_USERS; i += batchSize) {
    const batch = [];
    const endIndex = Math.min(i + batchSize, TOTAL_USERS);
    
    console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}: Users ${i + 1}-${endIndex}`);
    
    // Create promises for current batch
    for (let j = i + 1; j <= endIndex; j++) {
      batch.push(createTestUser(j));
    }

    // Wait for all promises in current batch to complete
    const batchResults = await Promise.allSettled(batch);
    
    // Process results
    batchResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        const userNumber = i + index + 1;
        console.error(`❌ Batch error for user ${userNumber}:`, result.reason);
        results.push({ 
          success: false, 
          email: `testuser${userNumber}@loadtest.com`, 
          reason: result.reason 
        });
      }
    });

    // Small delay between batches to be gentle on DynamoDB
    if (endIndex < TOTAL_USERS) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const alreadyExists = results.filter(r => r.reason === "already_exists").length;
  
  console.log(`✅ Successfully created: ${successful} users`);
  console.log(`⚠️  Already existed: ${alreadyExists} users`);
  console.log(`❌ Failed: ${failed - alreadyExists} users`);
  console.log(`📈 Total processed: ${results.length} users`);

  // Show failed users (excluding already exists)
  const realFailures = results.filter(r => !r.success && r.reason !== "already_exists");
  if (realFailures.length > 0) {
    console.log("\n❌ Failed users:");
    realFailures.forEach(failure => {
      console.log(`   ${failure.email}: ${failure.reason}`);
    });
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createAllTestUsers()
    .then(() => {
      console.log("\n🎉 Script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Script failed:", error);
      process.exit(1);
    });
}

export { createAllTestUsers, createTestUser };