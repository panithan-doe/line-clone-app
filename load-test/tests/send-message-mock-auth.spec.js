/**
 * Playwright Load Test with Mocked Authentication
 * Bypasses login flow by mocking authentication state
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Load test data
const testDataPath = path.join(__dirname, '../data/test-data.json');
let testData;
try {
  testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
} catch (error) {
  console.error('Failed to load test data:', error);
  process.exit(1);
}

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 50;
const MESSAGES_PER_USER = parseInt(process.env.MESSAGES_PER_USER) || 10;

test.describe('Load Test - Send Message (Mock Auth)', () => {
  test.describe.configure({ mode: 'parallel' });

  for (let userIndex = 0; userIndex < Math.min(CONCURRENT_USERS, testData.users.length); userIndex++) {
    const user = testData.users[userIndex];
    const chatRoom = testData.chatRooms[userIndex % testData.chatRooms.length];
    
    test(`User ${userIndex + 1}: Send messages without login`, async ({ page }) => {
      const testId = `mock-auth-user-${userIndex + 1}-${Date.now()}`;
      const messages = [];
      const timings = [];
      
      // Mock authentication before navigating to the app
      await page.addInitScript((userData) => {
        // Mock Amplify authentication state
        window.localStorage.setItem('amplify-authenticator-authState', 'signedIn');
        window.localStorage.setItem('amplify-signin-with-hostedUI', 'false');
        
        // Mock user session
        const mockSession = {
          user: {
            attributes: {
              email: userData.email,
              nickname: userData.nickname,
              sub: userData.id
            }
          },
          credentials: {
            accessToken: 'mock-access-token',
            idToken: 'mock-id-token'
          }
        };
        window.localStorage.setItem('amplify-user-session', JSON.stringify(mockSession));
        
        // Mock authentication methods
        window.mockAmplifyAuth = {
          getCurrentUser: () => Promise.resolve(mockSession.user),
          fetchAuthSession: () => Promise.resolve(mockSession),
          signOut: () => Promise.resolve()
        };
      }, user);

      // Navigate to app
      await page.goto(APP_URL);
      
      // Wait for app to load and check if we can see chat interface
      try {
        // Look for chat interface elements (home page with chat rooms)
        await page.waitForSelector('[data-testid="chat-list"], .chat-room-list, text="Chat"', { timeout: 10000 });
        
        // Select a chat room
        await selectChatRoomMockAuth(page, chatRoom);
        
        // Wait for message input to appear
        await page.waitForSelector('input[placeholder*="message"], input[placeholder*="Type"]', { timeout: 10000 });
        
        // Send messages
        for (let i = 0; i < MESSAGES_PER_USER; i++) {
          const messageText = `Mock auth test message ${i + 1} from ${user.nickname}`;
          const startTime = Date.now();
          
          try {
            // Find and fill message input
            const messageInput = page.locator('input[placeholder*="message"], input[placeholder*="Type"]').first();
            await messageInput.fill(messageText);
            
            // Find and click send button
            const sendButton = page.locator('button:has(svg)', { hasText: /send/i }).or(
              page.locator('button').filter({ hasText: /send/i })
            ).or(
              page.locator('[data-testid="send-button"]')
            ).first();
            
            await sendButton.click();
            
            // Wait for message to be sent (input should clear)
            await expect(messageInput).toHaveValue('', { timeout: 5000 });
            
            const duration = Date.now() - startTime;
            timings.push(duration);
            messages.push({
              index: i + 1,
              text: messageText,
              duration: duration,
              timestamp: new Date().toISOString()
            });
            
            console.log(`${testId}: Message ${i + 1} sent in ${duration}ms`);
            
            // Brief pause between messages
            await page.waitForTimeout(500);
            
          } catch (error) {
            console.error(`${testId}: Failed to send message ${i + 1}:`, error.message);
          }
        }
        
        // Calculate results
        const successRate = (messages.length / MESSAGES_PER_USER) * 100;
        const avgDuration = timings.reduce((a, b) => a + b, 0) / timings.length || 0;
        
        console.log(`${testId}: Completed - ${messages.length}/${MESSAGES_PER_USER} messages (${successRate.toFixed(1)}%)`);
        
        // Assertions
        expect(messages.length).toBeGreaterThan(0);
        expect(successRate).toBeGreaterThan(50);
        
      } catch (error) {
        console.error(`${testId}: Test failed:`, error.message);
        
        // Take screenshot for debugging
        await page.screenshot({ 
          path: `load-test/results/error-${testId}.png`,
          fullPage: true 
        });
        
        throw error;
      }
    });
  }
});

async function selectChatRoomMockAuth(page, chatRoom) {
  try {
    // Try to find and click the chat room
    const chatRoomSelectors = [
      `text="${chatRoom.name}"`,
      `[data-testid*="chat-room"]:has-text("${chatRoom.name}")`,
      `.chat-room:has-text("${chatRoom.name}")`,
      // Fallback: click first available chat room
      '[data-testid*="chat-room"]:first-child',
      '.chat-room:first-child'
    ];
    
    for (const selector of chatRoomSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          await page.waitForTimeout(1000);
          return;
        }
      } catch (e) {
        continue;
      }
    }
    
    console.log(`Could not find specific chat room ${chatRoom.name}, using first available`);
    
  } catch (error) {
    console.log(`Chat room selection failed: ${error.message}`);
  }
}