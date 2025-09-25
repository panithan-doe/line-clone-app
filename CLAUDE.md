# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a LINE-clone chat application built with React, TypeScript, Vite, and AWS Amplify. The application features real-time messaging, authentication, and chat room management.

## Commands

### Development
- `npm run dev` - Start the Vite development server
- `npm run build` - Build the production application
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview the production build locally

### AWS Amplify Backend
- `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID` - Deploy Amplify backend resources

## Architecture

### 🎯 Application Purpose
This LINE Clone Chat Application is designed for:
1. **Real-time messaging** - Instant message delivery with live updates
2. **Scalability testing** - Support for high concurrent user loads
3. **AWS Architecture study** - Showcase of serverless patterns and services

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: AWS Amplify Gen 2
- **Authentication**: AWS Cognito (via Amplify Auth)
- **Database**: AWS AppSync with DynamoDB (via Amplify Data)
- **UI Components**: AWS Amplify UI React, Lucide React icons
- **Message Processing**: AWS Lambda + SQS for async processing

### Project Structure
- `/src/components/` - React components organized by feature
  - `Auth/` - Authentication components (LoginForm, SignUpForm, AuthWrapper, MockAuthWrapper)
  - `Chat/` - Chat application components (ChatApp, ChatRoom, MessageList, etc.)
- `/amplify/` - AWS Amplify backend configuration
  - `auth/resource.ts` - Authentication configuration with email login and nickname attribute
  - `data/resource.ts` - Data schema defining User, ChatRoom, Message, and ChatRoomMember models
  - `backend.ts` - Backend definition combining auth, data, storage, and Lambda functions
  - `functions/` - 8 Lambda functions for backend operations
- `/load-test/` - Load testing infrastructure
  - `lambda/` - Playwright-based load testing Lambda function
  - `orchestrator.js` - Concurrent test orchestrator
  - `tests/` - Playwright test specifications
- `/src/lib/amplify.ts` - Amplify client configuration
- `/src/types/` - TypeScript type definitions

### Key Data Models
1. **User** - email (identifier), nickname, avatar, description, owner
2. **ChatRoom** - name, type (private/group), description, avatar, lastMessage/At
3. **Message** - content, type, chatRoomId, sender info, isRead status
4. **ChatRoomMember** - chatRoomId, userId, role (admin/member), lastRead tracking
5. **MessageReadStatus** - messageId, userId, readAt (for group chats)

### 🔄 Message Flow Architecture
1. **Frontend** calls `sendMessage` GraphQL mutation
2. **sendMessage Lambda** validates membership and sends to SQS Queue
3. **SQS Queue** queues messages for async processing
4. **messageProcessor Lambda** processes messages from SQS and saves to DynamoDB
5. **Real-time subscriptions** (AppSync) deliver updates to connected clients
6. **ChatRoom** lastMessage is updated for sidebar display

### Authentication & Authorization
- Email-based authentication with required nickname attribute
- Mock login mode available for load testing
- Uses AWS Amplify Authenticator component for UI
- Authorization rules ensure users can only access their own data and authenticated content
- USER_PASSWORD_AUTH flow enabled for programmatic testing

### Build Configuration
- TypeScript configured with strict mode and bundler module resolution
- ESLint setup with React hooks and refresh plugins
- Vite optimized for React development with hot module replacement
- Node.js version 20 required for builds (specified in amplify.yml)

## AWS Infrastructure Details

### Core Services
- **AWS Amplify** - Frontend hosting and CI/CD pipeline
- **AppSync** - GraphQL API with real-time subscriptions
- **DynamoDB** - NoSQL database with Global Secondary Indexes
- **Lambda** - 8 serverless functions for backend operations
- **SQS** - Message queue for async message processing  
- **S3** - File storage for user profile images
- **Cognito** - User authentication and authorization

### Lambda Functions (8 total)
1. **sendMessage** - Validates membership and queues messages to SQS
2. **messageProcessor** - Processes messages from SQS and saves to DynamoDB
3. **createPrivateChat** - Creates private conversations between users
4. **createGroupChat** - Creates group chats with multiple members
5. **userAuth** - User account creation and profile management
6. **updateProfileImage** - Handles profile picture uploads to S3
7. **markChatAsRead** - Updates read status for chat rooms
8. **getUnreadCounts** - Calculates unread message counts

### SQS Integration
- **Standard Queue** (not FIFO) for message processing
- **Dead Letter Queue** for failed message handling
- **Batch processing** (up to 10 messages) with partial failure reporting
- **Retry logic** (3 attempts before DLQ)

### DynamoDB Tables & Indexes
- **Secondary Indexes**:
  - `chatRoomId-userId-index` on ChatRoomMember table
  - `userId-index` on ChatRoomMember table
- **Authorization**: User-based access control with owner patterns

## Important Notes
- The application uses AWS Amplify Gen 2 with TypeScript-based backend configuration
- All data models have built-in authorization rules for security
- The frontend expects `amplify_outputs.json` for configuration (generated by Amplify CLI)
- Tailwind CSS is configured for styling
- The project uses Vite's ES module system
- Message processing uses async pattern (SQS → Lambda) for better scalability
- Real-time updates delivered via AppSync subscriptions
- Fallback mechanisms: Lambda → Direct AppSync if SQS fails

## Load Testing Architecture

### 🧪 Purpose & Approach
The load testing system is designed to simulate high concurrent user loads on the chat application to test scalability and performance under stress.

### Testing Tools & Infrastructure
- **Playwright** - E2E testing framework for browser automation
- **AWS Lambda** - Serverless execution of load tests (function: `line-load-test-playwright`)
- **Docker** - Containerized Playwright with Chromium browser
- **Node.js Orchestrator** - Manages concurrent test execution
- **ECR** - Container image storage
- **SQS + DynamoDB** - Backend services under test

### Load Testing Flow
1. **Orchestrator** (`orchestrator.js`) creates multiple concurrent Lambda invocations
2. Each **Lambda function** runs an independent Playwright test:
   - Navigate to app URL (production: `https://main.d3i99hvdc3wo2j.amplifyapp.com`)
   - Enter load testing mode → Mock authentication
   - Login with test user (`testuser1@loadtest.com` - `testuser100@loadtest.com`)
   - Select first available chat room
   - Send messages continuously at specified intervals (default: 2 seconds)
3. **Metrics Collection**:
   - Lambda execution duration
   - Message success/failure rates
   - Overall test completion status
   - Phase-by-phase performance tracking

### Test Configuration
- **Concurrent Users**: 10-100+ users (configurable)
- **Test Duration**: 30-60 seconds per user
- **Message Interval**: 2 seconds between messages
- **AWS Region**: ap-southeast-1
- **Test Scripts**: 
  - `npm run test-10` (10 users, 30s)
  - `npm run test-50` (50 users, 60s)
  - `npm run test-100` (100 users, 60s)

### Docker Setup
- **Base Image**: `public.ecr.aws/lambda/nodejs:20`
- **Dependencies**: Chromium browser + system libs
- **Environment**: Headless browser execution
- **Handler**: `index.handler` in Lambda

### Test Phases
1. **Phase 1**: Navigation and load test mode setup
2. **Phase 2**: Mock authentication and login
3. **Phase 3**: Chat room selection
4. **Phase 4**: Continuous message sending with real-time validation

### Monitoring & Results
- Real-time console logging during test execution
- Comprehensive test reports with success rates
- Lambda performance metrics
- Message delivery confirmation
- Error tracking and analysis

This load testing architecture allows for realistic simulation of concurrent chat users, testing both frontend responsiveness and backend scalability under high loads.