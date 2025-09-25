import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'ap-southeast-1' });

const DEFAULT_CONFIG = {
  functionName: 'line-load-test-playwright',
  concurrentUsers: 100,
  testDurationMs: 60000, // 1 minute
  messageInterval: 2000, // 2 seconds
  region: 'ap-southeast-1'
};

class LoadTestOrchestrator {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.results = [];
    this.errors = [];
    this.startTime = null;
    this.endTime = null;
  }

  async invokeLambdaFunction(userEmail, testId) {
    const payload = {
      userEmail,
      testDurationMs: this.config.testDurationMs,
      messageInterval: this.config.messageInterval,
      testId
    };

    const command = new InvokeCommand({
      FunctionName: this.config.functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    });

    const startTime = Date.now();
    
    try {
      console.log(`🚀 [${testId}] Starting Lambda for ${userEmail}`);
      
      const response = await lambdaClient.send(command);
      const endTime = Date.now();
      
      let result;
      try {
        const lambdaResponse = JSON.parse(new TextDecoder().decode(response.Payload));
        // Lambda returns {statusCode: 200, body: "stringified_json"}
        // Need to parse the body again
        if (lambdaResponse.body) {
          result = JSON.parse(lambdaResponse.body);
        } else {
          result = lambdaResponse;
        }
      } catch (parseError) {
        throw new Error(`Failed to parse Lambda response: ${parseError.message}`);
      }

      if (response.FunctionError) {
        throw new Error(`Lambda function error: ${response.FunctionError}`);
      }

      const testResult = {
        testId,
        userEmail,
        lambdaSuccess: true,
        lambdaDuration: endTime - startTime,
        lambdaStatusCode: response.StatusCode,
        playwrightResult: result,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ [${testId}] Lambda completed for ${userEmail} in ${endTime - startTime}ms`);
      return testResult;

    } catch (error) {
      const endTime = Date.now();
      const errorResult = {
        testId,
        userEmail,
        lambdaSuccess: false,
        lambdaDuration: endTime - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      console.error(`❌ [${testId}] Lambda failed for ${userEmail}: ${error.message}`);
      return errorResult;
    }
  }

  async runConcurrentLoadTest() {
    console.log(`🎯 Starting load test with ${this.config.concurrentUsers} concurrent users`);
    console.log(`⏱️ Test duration: ${this.config.testDurationMs / 1000} seconds`);
    console.log(`💬 Message interval: ${this.config.messageInterval / 1000} seconds`);
    console.log(`🔧 Lambda function: ${this.config.functionName}`);
    console.log('=' + '='.repeat(70));

    this.startTime = Date.now();

    // Create promises for all concurrent Lambda invocations
    const lambdaPromises = [];
    
    for (let i = 1; i <= this.config.concurrentUsers; i++) {
      const userEmail = `testuser${i}@loadtest.com`;
      const testId = `test-${i.toString().padStart(3, '0')}`;
      
      const promise = this.invokeLambdaFunction(userEmail, testId);
      lambdaPromises.push(promise);
    }
    
    // Wait for all Lambda functions to complete
    console.log(`🔄 Waiting for all ${this.config.concurrentUsers} Lambda functions to complete...`);
    
    try {
      this.results = await Promise.allSettled(lambdaPromises);
      this.endTime = Date.now();
      
      console.log('=' + '='.repeat(70));
      console.log(`🏁 All Lambda functions completed in ${(this.endTime - this.startTime) / 1000} seconds`);
      
      this.generateReport();
      
    } catch (error) {
      console.error('💥 Critical error during load test:', error);
      this.endTime = Date.now();
    }
  }

  generateReport() {
    const totalTests = this.results.length;
    const successfulResults = this.results.filter(r => r.status === 'fulfilled' && r.value.lambdaSuccess);
    const failedResults = this.results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.lambdaSuccess));
    
    const successfulLambdas = successfulResults.length;
    const failedLambdas = failedResults.length;
    const successRate = (successfulLambdas / totalTests) * 100;

    // Analyze Playwright results for successful Lambda executions
    let playwrightSuccesses = 0;
    let playwrightFailures = 0;
    let totalMessages = 0;
    let totalSuccessfulMessages = 0;
    const lambdaDurations = [];

    successfulResults.forEach(result => {
      const { value } = result;
      lambdaDurations.push(value.lambdaDuration);
      
      if (value.playwrightResult && value.playwrightResult.success) {
        playwrightSuccesses++;
        if (value.playwrightResult.metrics) {
          totalMessages += value.playwrightResult.metrics.messagesAttempted || 0;
          totalSuccessfulMessages += value.playwrightResult.metrics.messagesSucceeded || 0;
        }
      } else {
        playwrightFailures++;
      }
    });

    const avgLambdaDuration = lambdaDurations.length > 0 
      ? lambdaDurations.reduce((a, b) => a + b, 0) / lambdaDurations.length 
      : 0;

    const maxLambdaDuration = lambdaDurations.length > 0 ? Math.max(...lambdaDurations) : 0;
    const minLambdaDuration = lambdaDurations.length > 0 ? Math.min(...lambdaDurations) : 0;

    console.log('\n📊 LOAD TEST REPORT');
    console.log('=' + '='.repeat(50));
    console.log(`📅 Test completed: ${new Date().toISOString()}`);
    console.log(`⏱️ Total test duration: ${(this.endTime - this.startTime) / 1000} seconds`);
    console.log(`👥 Concurrent users: ${this.config.concurrentUsers}`);
    console.log(`🎯 Test duration per user: ${this.config.testDurationMs / 1000} seconds`);
    
    console.log('\n🚀 LAMBDA EXECUTION RESULTS');
    console.log('-'.repeat(30));
    console.log(`✅ Successful Lambda executions: ${successfulLambdas}/${totalTests} (${successRate.toFixed(1)}%)`);
    console.log(`❌ Failed Lambda executions: ${failedLambdas}/${totalTests}`);
    console.log(`⏱️ Average Lambda duration: ${avgLambdaDuration.toFixed(0)}ms`);
    console.log(`⏱️ Min/Max Lambda duration: ${minLambdaDuration}ms / ${maxLambdaDuration}ms`);

    console.log('\n🎭 PLAYWRIGHT E2E TEST RESULTS');
    console.log('-'.repeat(30));
    console.log(`✅ Successful E2E tests: ${playwrightSuccesses}/${successfulLambdas}`);
    console.log(`❌ Failed E2E tests: ${playwrightFailures}/${successfulLambdas}`);
    console.log(`💬 Total messages attempted: ${totalMessages}`);
    console.log(`💬 Total messages succeeded: ${totalSuccessfulMessages}`);
    
    if (totalMessages > 0) {
      const messageSuccessRate = (totalSuccessfulMessages / totalMessages) * 100;
      console.log(`💬 Message success rate: ${messageSuccessRate.toFixed(1)}%`);
    }

    console.log('\n❌ FAILED TESTS DETAILS');
    console.log('-'.repeat(30));
    failedResults.slice(0, 10).forEach((result, index) => {
      if (result.status === 'rejected') {
        console.log(`${index + 1}. Promise rejected: ${result.reason}`);
      } else if (result.value && !result.value.lambdaSuccess) {
        console.log(`${index + 1}. ${result.value.testId} (${result.value.userEmail}): ${result.value.error}`);
      }
    });

    if (failedResults.length > 10) {
      console.log(`... and ${failedResults.length - 10} more failures`);
    }

    console.log('\n' + '='.repeat(50));
    
    return {
      summary: {
        totalTests,
        successfulLambdas,
        failedLambdas,
        successRate,
        playwrightSuccesses,
        playwrightFailures,
        totalMessages,
        totalSuccessfulMessages,
        avgLambdaDuration,
        testDurationSeconds: (this.endTime - this.startTime) / 1000
      },
      detailedResults: this.results
    };
  }

  async runTest(concurrentUsers = null) {
    if (concurrentUsers !== null) {
      this.config.concurrentUsers = concurrentUsers;
    }
    
    return await this.runConcurrentLoadTest();
  }
}

// Export for use as module
export { LoadTestOrchestrator };

// CLI execution if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);
  const concurrentUsers = args[0] ? parseInt(args[0]) : DEFAULT_CONFIG.concurrentUsers;
  const testDuration = args[1] ? parseInt(args[1]) * 1000 : DEFAULT_CONFIG.testDurationMs;
  
  const orchestrator = new LoadTestOrchestrator({
    concurrentUsers,
    testDurationMs: testDuration
  });
  
  orchestrator.runTest()
    .then(() => {
      console.log('\n🎉 Load test completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Load test failed:', error);
      process.exit(1);
    });
}