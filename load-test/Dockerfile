# Load Test Container for Playwright Tests
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Install additional dependencies for AWS SDK
RUN npm install uuid @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# Copy test files and scripts
COPY tests/ ./tests/
COPY scripts/ ./scripts/
COPY data/ ./data/
COPY playwright.config.js ./
COPY .env* ./

# Install browsers (if needed)
RUN npx playwright install

# Create results directory
RUN mkdir -p results

# Set environment variables
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Default command - can be overridden
CMD ["npx", "playwright", "test", "tests/send-message-mock-auth.spec.js", "--workers=5"]