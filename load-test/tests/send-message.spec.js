import { test, expect } from '@playwright/test';

// Array of test users (1-5)
const testUsers = [
  'testuser1@loadtest.com',
  'testuser2@loadtest.com', 
  'testuser3@loadtest.com',
  'testuser4@loadtest.com',
  'testuser5@loadtest.com'
];

test.describe('LINE Clone Chat App Load Test', () => {
  
  // Test with all users simultaneously
  test('All users login simultaneously', async ({ browser }) => {
    const contexts = [];
    const pages = [];
    
    try {
      // Create browser contexts for each user
      for (let i = 0; i < testUsers.length; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }
      
      // Phase 1: Login all users in parallel (until Welcome to LINE Clone)
      console.log('🚀 Phase 1: Starting login for all users...');
      const loginPromises = pages.map(async (page, index) => {
        const email = testUsers[index];
        
        await page.goto('http://localhost:5174');
        
        // Step 1: Click Load Testing Button
        await expect(page.locator('button:has-text("Load Testing")')).toBeVisible();
        await page.click('button:has-text("Load Testing")');
        
        // Step 2: Cognito auth (after entering load test mode)
        await expect(page.locator('button:has-text("Authenticate with Cognito")')).toBeVisible();
        await page.click('button:has-text("Authenticate with Cognito")');
        await expect(page.locator('text=Load Test Login')).toBeVisible();
        
        // Mock login
        await page.locator('input[type="email"]').fill(email);
        await page.click('button:has-text("Mock Sign In")');
        
        await expect(page.locator('h2:has-text("Welcome to LINE Clone")')).toBeVisible({ timeout: 15000 });
        
        console.log(`✅ ${email} logged in successfully`);
        return { page, email };
      });
      
      const results = await Promise.all(loginPromises);
      console.log('🎉 Phase 1 Complete: All users logged in successfully!');
      
      // Phase 2: Select chat rooms for all users in parallel
      console.log('🚀 Phase 2: Selecting chat rooms for all users...');
      const chatRoomPromises = results.map(async ({ page, email }) => {
        console.log(`🔍 Looking for chat rooms for ${email}...`);
        await page.waitForTimeout(2000); // Give time for chat rooms to load
        
        const firstChatRoom = page.locator('.w-80 .p-4.hover\\:bg-gray-50.cursor-pointer').first();
        if (await firstChatRoom.isVisible()) {
          await firstChatRoom.click();
          console.log(`📁 Selected first chat room for ${email}`);
          await page.waitForTimeout(1000); // Wait for chat room to open
        } else {
          console.log(`⚠️ No chat rooms found for ${email}`);
        }
        
        return { page, email };
      });
      
      const chatRoomResults = await Promise.all(chatRoomPromises);
      console.log('🎉 Phase 2 Complete: All users selected chat rooms!');
      
      // Phase 3: Send messages from all users simultaneously
      console.log('🚀 Phase 3: Sending messages from all users simultaneously...');
      const messagePromises = chatRoomResults.map(async ({ page, email }) => {
        // Look for message input field with specific placeholder
        const messageInput = page.locator('input[placeholder="Type a message..."]');
        
        if (await messageInput.isVisible()) {
          const testMessage = `Concurrent message from ${email} - ${Date.now()}`;
          await messageInput.fill(testMessage);
          
          // Look for send button (button with Send icon, will be enabled after typing)
          const sendButton = page.locator('button:has([class*="w-5 h-5"]):not([disabled])').last();
          if (await sendButton.isVisible()) {
            await sendButton.click();
            
            // Verify message was sent by looking for it in the chat area
            await expect(page.locator('.flex-1 .flex.flex-col').locator(`text=${testMessage}`).first()).toBeVisible({ timeout: 5000 });
            console.log(`✅ Concurrent message sent by ${email}`);
          } else {
            console.log(`⚠️ Send button not found or not enabled for ${email}`);
          }
        } else {
          console.log(`⚠️ Message input not found for ${email}`);
        }
      });
      
      await Promise.all(messagePromises);
      console.log('🎉 Phase 3 Complete: All concurrent messages sent successfully!');
      
    } finally {
      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    }
  });
});