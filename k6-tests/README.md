# k6 Performance Testing for LINE Clone App

This directory contains k6 performance tests for your LINE-clone chat application, designed to test the system's ability to handle 1000 concurrent users performing core chat operations.

## 📋 Overview

The test suite covers three main functionalities:
- **Message Sending** - Testing real-time message delivery under load
- **Private Chat Creation** - Testing friend/contact addition functionality
- **Group Chat Creation** - Testing group chat setup and member management

## 🏗️ Test Architecture

```
k6-tests/
├── config.js                 # Configuration and GraphQL operations
├── auth-helper.js            # Authentication and user management
├── send-message-test.js      # Message sending load test
├── create-private-chat-test.js # Private chat creation test
├── create-group-chat-test.js # Group chat creation test
├── master-load-test.js       # Combined test for 1000 users
├── setup-test-data.js        # Test data initialization
└── README.md                 # This documentation
```

## 🚀 Quick Start

### 1. Prerequisites

- k6 installed globally (`brew install k6` on macOS)
- Your LINE-clone app deployed and running
- Test users created in AWS Cognito (see Configuration section)

### 2. Configuration

Edit `k6-tests/config.js` and update:

```javascript
// Update with your actual values
APPSYNC_URL: 'your-appsync-endpoint',
USER_POOL_ID: 'your-user-pool-id',
CLIENT_ID: 'your-client-id',

// Add your test users
TEST_USERS: {
  USERS: [
    { email: 'test1@example.com', password: 'Password123!', nickname: 'TestUser1' },
    { email: 'test2@example.com', password: 'Password123!', nickname: 'TestUser2' },
    // Add more test users...
  ]
}
```

### 3. Set Up Test Data (Optional)

```bash
cd k6-tests
k6 run setup-test-data.js
```

### 4. Run Tests

**Individual Tests:**
```bash
# Test message sending (200 concurrent users)
k6 run send-message-test.js

# Test private chat creation (100 concurrent users)
k6 run create-private-chat-test.js

# Test group chat creation (50 concurrent users)
k6 run create-group-chat-test.js
```

**Master Load Test (1000 concurrent users):**
```bash
k6 run master-load-test.js
```

## 📊 Test Scenarios

### Master Load Test Profile

The master test simulates realistic user behavior with 1000 concurrent users:

```
Ramp-up Profile:
├── 0-2min:  0 → 100 users
├── 2-5min:  100 → 500 users  
├── 5-7min:  500 → 1000 users
├── 7-17min: 1000 users (sustained load)
└── 17-20min: 1000 → 0 users
```

**User Behavior Distribution:**
- 70% Send Messages (most frequent action)
- 20% Create Private Chats (moderate frequency)  
- 10% Create Group Chats (least frequent)

### Performance Thresholds

```javascript
http_req_duration: ['p(95)<5000'], // 95% requests < 5 seconds
http_req_failed: ['rate<0.1'],     // Error rate < 10%
checks: ['rate>0.9'],              // Success rate > 90%
```

## 🔧 Configuration Details

### Test Users

Create test users in your Cognito User Pool with these requirements:
- Valid email addresses
- Strong passwords (meet your password policy)
- Confirmed email status
- Unique nicknames

**Recommended: 10-20 test users for realistic testing**

### Authentication

The current implementation uses mock authentication for load testing. For production testing:

1. Update `auth-helper.js` with real Cognito SRP authentication
2. Implement proper token refresh handling
3. Add rate limiting considerations

### GraphQL Operations

All tests use the following GraphQL operations:
- `sendMessage` - Send messages to chat rooms
- `createPrivateChat` - Create private chats between users
- `createGroupChat` - Create group chats with multiple members

## 📈 Monitoring and Analysis

### Key Metrics to Monitor

**k6 Metrics:**
- Request duration (response time)
- Request failure rate
- Check success rate
- Virtual users (VUs)

**AWS CloudWatch Metrics:**
- AppSync request count/latency
- Lambda invocation duration/errors
- DynamoDB read/write capacity consumption
- Cognito authentication metrics

### Expected Results for 1000 Users

**Good Performance:**
- 95% of requests complete in < 5 seconds
- Error rate < 10%
- Steady throughput without degradation

**Warning Signs:**
- Increasing response times over test duration
- High error rates (>15%)
- AWS service throttling errors

## 🐛 Troubleshooting

### Common Issues

**1. Authentication Errors**
```
Error: Users not found in test pool
```
**Solution:** Ensure test users exist in Cognito and are confirmed.

**2. High Error Rates**
```
http_req_failed rate > 10%
```
**Solutions:**
- Check AWS service limits (DynamoDB, Lambda concurrency)
- Monitor CloudWatch for throttling
- Verify AppSync schema and resolvers

**3. Slow Response Times**
```
http_req_duration p(95) > 5000ms
```
**Solutions:**
- Check DynamoDB provisioned capacity
- Review Lambda function performance
- Monitor network latency

### Debug Mode

Run tests with verbose logging:
```bash
k6 run --verbose master-load-test.js
```

## 🔒 Security Considerations

**Important Notes:**
- Never commit real credentials or API keys
- Use dedicated test environment
- Implement proper authentication for production testing
- Monitor costs during large-scale testing

## 🏃‍♂️ Next Steps

1. **Baseline Testing:** Run tests on empty system to establish baseline
2. **Gradual Scaling:** Start with lower user counts and scale up
3. **Monitoring Setup:** Configure CloudWatch dashboards
4. **Optimization:** Use results to optimize bottlenecks
5. **Continuous Testing:** Integrate into CI/CD pipeline

## 📞 Support

For issues with the k6 tests:
1. Check the troubleshooting section above
2. Review k6 documentation: https://k6.io/docs/
3. Monitor AWS service health and limits

---

**Generated for LINE Clone App Performance Testing**