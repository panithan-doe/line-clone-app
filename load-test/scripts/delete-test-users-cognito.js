import { CognitoIdentityProviderClient, AdminDeleteUserCommand, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: "ap-southeast-1", // Production region
});

// Configuration for Production
const USER_POOL_ID = "ap-southeast-1_UB5QhwMCh"; // Production User Pool ID
const TOTAL_USERS = 100;

async function deleteTestUser(userNumber) {
  const email = `testuser${userNumber}@loadtest.com`;
  
  try {
    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email, // Cognito uses email as username
    });

    await cognitoClient.send(command);
    console.log(`✅ Deleted user: ${email}`);
    return { success: true, email };
  } catch (error) {
    if (error.name === "UserNotFoundException") {
      console.log(`⚠️  User not found: ${email}`);
      return { success: false, email, reason: "not_found" };
    } else {
      console.error(`❌ Failed to delete user ${email}:`, error.message);
      return { success: false, email, reason: error.message };
    }
  }
}

async function listTestUsers() {
  console.log("🔍 Checking existing test users in Cognito...");
  
  try {
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: 'email ^= "testuser"', // Filter users whose email starts with "testuser"
    });
    
    const response = await cognitoClient.send(command);
    const testUsers = response.Users.filter(user => {
      const email = user.Attributes.find(attr => attr.Name === 'email')?.Value;
      return email && email.match(/^testuser\d+@loadtest\.com$/);
    });
    
    console.log(`📊 Found ${testUsers.length} test users in Cognito`);
    return testUsers;
  } catch (error) {
    console.error("❌ Failed to list users:", error.message);
    return [];
  }
}

async function deleteAllTestUsers() {
  console.log(`🚀 Starting deletion of test users from Production Cognito User Pool...`);
  console.log(`🏊 User Pool ID: ${USER_POOL_ID}`);
  console.log(`🌏 Region: ap-southeast-1`);
  console.log("─".repeat(50));

  // First, list existing test users
  await listTestUsers();
  
  console.log(`\n🗑️  Attempting to delete ${TOTAL_USERS} test users...`);
  
  const results = [];
  const batchSize = 5; // Smaller batch size for delete operations

  for (let i = 0; i < TOTAL_USERS; i += batchSize) {
    const batch = [];
    const endIndex = Math.min(i + batchSize, TOTAL_USERS);
    
    console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}: Users ${i + 1}-${endIndex}`);
    
    // Create promises for current batch
    for (let j = i + 1; j <= endIndex; j++) {
      batch.push(deleteTestUser(j));
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

    // Delay between batches to respect API rate limits
    if (endIndex < TOTAL_USERS) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 DELETION SUMMARY");
  console.log("=".repeat(50));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const notFound = results.filter(r => r.reason === "not_found").length;
  
  console.log(`✅ Successfully deleted: ${successful} users`);
  console.log(`⚠️  Not found: ${notFound} users`);
  console.log(`❌ Failed: ${failed - notFound} users`);
  console.log(`📈 Total processed: ${results.length} users`);

  // Show failed users (excluding not found)
  const realFailures = results.filter(r => !r.success && r.reason !== "not_found");
  if (realFailures.length > 0) {
    console.log("\n❌ Failed deletions:");
    realFailures.forEach(failure => {
      console.log(`   ${failure.email}: ${failure.reason}`);
    });
  }

  // Final verification
  console.log("\n🔍 Verifying deletion...");
  await listTestUsers();
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteAllTestUsers()
    .then(() => {
      console.log("\n🎉 Deletion script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Script failed:", error);
      process.exit(1);
    });
}

export { deleteAllTestUsers, deleteTestUser };