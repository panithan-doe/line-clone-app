const { chromium } = require('playwright');

// Lambda handler for Playwright load testing
exports.handler = async (event) => {
  console.log('🚀 Starting Playwright Lambda Load Test');
  console.log('📋 Event:', JSON.stringify(event, null, 2));
  
  const {
    userEmail = 'testuser1@loadtest.com',
    appUrl = 'https://main.d3i99hvdc3wo2j.amplifyapp.com', // Production app URL
    testDurationMs = 30000, // 30 seconds
    messageInterval = 2000 // Send message every 2 seconds
  } = event;

  let browser;
  let results = {
    success: false,
    userEmail,
    startTime: Date.now(),
    endTime: null,
    duration: null,
    phases: {},
    errors: [],
    metrics: {
      messagesAttempted: 0,
      messagesSucceeded: 0,
      messagesFailed: 0
    }
  };

  try {
    // Launch browser with Lambda-optimized settings
    console.log('🌐 Launching Chromium browser...');
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();

    // Phase 1: Navigate and Enter Load Test Mode
    console.log(`🔑 Phase 1: Starting load test mode for ${userEmail}`);
    const phase1Start = Date.now();
    
    await page.goto(appUrl, { waitUntil: 'networkidle' });
    
    // Click Load Testing Button
    await page.waitForSelector('button:has-text("Load Testing")', { timeout: 10000 });
    await page.click('button:has-text("Load Testing")');
    
    // Cognito Authentication
    await page.waitForSelector('button:has-text("Authenticate with Cognito")', { timeout: 10000 });
    await page.click('button:has-text("Authenticate with Cognito")');
    
    // Wait for mock login page
    await page.waitForSelector('text=Load Test Login', { timeout: 15000 });
    
    const phase1End = Date.now();
    results.phases.phase1_setup = {
      duration: phase1End - phase1Start,
      success: true
    };
    console.log(`✅ Phase 1 completed in ${phase1End - phase1Start}ms`);

    // Phase 2: Mock Login
    console.log(`🔐 Phase 2: Mock login for ${userEmail}`);
    const phase2Start = Date.now();
    
    await page.fill('input[type="email"]', userEmail);
    await page.click('button:has-text("Mock Sign In")');
    
    await page.waitForSelector('h2:has-text("Welcome to LINE Clone")', { timeout: 15000 });
    
    const phase2End = Date.now();
    results.phases.phase2_login = {
      duration: phase2End - phase2Start,
      success: true
    };
    console.log(`✅ Phase 2 completed in ${phase2End - phase2Start}ms`);

    // Phase 3: Select Chat Room
    console.log('📁 Phase 3: Selecting chat room');
    const phase3Start = Date.now();
    
    await page.waitForTimeout(3000); // Wait for chat rooms to load
    
    const firstChatRoom = page.locator('.w-80 .p-4.hover\\:bg-gray-50.cursor-pointer').first();
    await firstChatRoom.waitFor({ state: 'visible', timeout: 15000 });
    await firstChatRoom.click();
    
    await page.waitForTimeout(2000); // Wait for chat room to open
    
    const phase3End = Date.now();
    results.phases.phase3_chatselect = {
      duration: phase3End - phase3Start,
      success: true
    };
    console.log(`✅ Phase 3 completed in ${phase3End - phase3Start}ms`);

    // Phase 4: Send Messages Continuously
    console.log('💬 Phase 4: Sending messages continuously');
    const phase4Start = Date.now();
    
    const messageInput = page.locator('input[placeholder="Type a message..."]');
    await messageInput.waitFor({ state: 'visible', timeout: 15000 });
    
    const endTime = Date.now() + testDurationMs;
    let messageCount = 0;
    let successCount = 0;
    
    while (Date.now() < endTime) {
      try {
        messageCount++;
        const testMessage = `Lambda message ${messageCount} from ${userEmail} - ${Date.now()}`;
        
        // Clear and type message
        await messageInput.fill('');
        await messageInput.fill(testMessage);
        
        // Click send button
        const sendButton = page.locator('button:has([class*="w-5 h-5"]):not([disabled])').last();
        await sendButton.click();
        
        // Wait briefly to see if message appears
        await page.waitForSelector(`text=${testMessage}`, { timeout: 3000 });
        
        successCount++;
        console.log(`📤 Message ${messageCount} sent successfully`);
        
        // Wait before next message
        await page.waitForTimeout(messageInterval);
        
      } catch (error) {
        console.error(`❌ Message ${messageCount} failed:`, error.message);
        results.errors.push(`Message ${messageCount}: ${error.message}`);
        
        // Wait before next message even if this one failed
        await page.waitForTimeout(messageInterval);
      }
    }
    
    const phase4End = Date.now();
    results.phases.phase4_messaging = {
      duration: phase4End - phase4Start,
      messagesAttempted: messageCount,
      messagesSucceeded: successCount,
      messagesFailed: messageCount - successCount,
      successRate: (successCount / messageCount) * 100
    };
    
    console.log(`✅ Phase 4 completed: ${successCount}/${messageCount} messages succeeded`);

    // Calculate final results
    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;
    results.success = true;
    results.metrics = {
      messagesAttempted: messageCount,
      messagesSucceeded: successCount,
      messagesFailed: messageCount - successCount,
      messagesPerSecond: successCount / (results.duration / 1000),
      overallSuccessRate: (successCount / messageCount) * 100
    };

  } catch (error) {
    console.error('💥 Test failed:', error);
    results.success = false;
    results.errors.push(error.message);
    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }

  console.log('📊 Final Results:', JSON.stringify(results, null, 2));
  
  return {
    statusCode: results.success ? 200 : 500,
    body: JSON.stringify(results)
  };
};