#!/bin/bash

# Configuration for Production Cognito User Pool
USER_POOL_ID="ap-southeast-1_UB5QhwMCh"
REGION="ap-southeast-1"
EMAIL="testuser@loadtest.com"
PASSWORD="LoadTest123!"
TEMP_PASSWORD="TempPass123!"

echo "🚀 Creating Cognito test user for load testing..."
echo "📧 Email: $EMAIL"
echo "🏊 User Pool: $USER_POOL_ID"
echo "🌏 Region: $REGION"
echo "─────────────────────────────────────────────────"

# Step 1: Create user with temporary password
echo "👤 Step 1: Creating user with temporary password..."
aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
  --temporary-password "$TEMP_PASSWORD" \
  --message-action SUPPRESS \
  --region "$REGION"

if [ $? -eq 0 ]; then
  echo "✅ User created successfully"
else
  echo "❌ Failed to create user"
  exit 1
fi

# Step 2: Set permanent password
echo "🔑 Step 2: Setting permanent password..."
aws cognito-idp admin-set-user-password \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --password "$PASSWORD" \
  --permanent \
  --region "$REGION"

if [ $? -eq 0 ]; then
  echo "✅ Password set successfully"
else
  echo "❌ Failed to set password"
  exit 1
fi

# Step 3: Confirm user (mark as verified)
echo "✉️ Step 3: Confirming user..."
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --region "$REGION"

if [ $? -eq 0 ]; then
  echo "✅ User confirmed successfully"
else
  echo "❌ Failed to confirm user"
  exit 1
fi

# Step 4: Verify user creation
echo "🔍 Step 4: Verifying user creation..."
aws cognito-idp admin-get-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --region "$REGION" \
  --query '{Username:Username,UserStatus:UserStatus,Enabled:Enabled,UserAttributes:UserAttributes[?Name==`email`].Value|[0]}' \
  --output table

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 Cognito test user created successfully!"
  echo "📝 Login credentials:"
  echo "   Email: $EMAIL"
  echo "   Password: $PASSWORD"
  echo ""
  echo "🔧 Next steps:"
  echo "1. Run the DynamoDB user creation script"
  echo "2. Implement mock authentication"
else
  echo "❌ Failed to verify user"
  exit 1
fi