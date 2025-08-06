#!/bin/bash

# Create Cognito Test Users for k6 Performance Testing
# This script creates test users in your Cognito User Pool

# Configuration from your amplify_outputs.json
USER_POOL_ID="ap-southeast-1_kdnEacZ2M"
REGION="ap-southeast-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Creating Cognito test users for k6 load testing...${NC}"
echo -e "User Pool ID: ${USER_POOL_ID}"
echo -e "Region: ${REGION}"
echo ""

# Function to create a user
create_user() {
    local email=$1
    local nickname=$2
    local temp_password=$3
    local final_password=$4
    
    echo -e "${YELLOW}Creating user: ${email} (${nickname})...${NC}"
    
    # Create user with temporary password
    aws cognito-idp admin-create-user \
        --user-pool-id ${USER_POOL_ID} \
        --username ${email} \
        --user-attributes Name=email,Value=${email} Name=nickname,Value=${nickname} Name=email_verified,Value=true \
        --temporary-password ${temp_password} \
        --message-action SUPPRESS \
        --region ${REGION}
    
    if [ $? -eq 0 ]; then
        echo -e "  ✓ User created successfully"
        
        # Set permanent password
        aws cognito-idp admin-set-user-password \
            --user-pool-id ${USER_POOL_ID} \
            --username ${email} \
            --password ${final_password} \
            --permanent \
            --region ${REGION}
            
        if [ $? -eq 0 ]; then
            echo -e "  ✓ Password set successfully"
            
            # Confirm user (mark as verified)
            aws cognito-idp admin-confirm-sign-up \
                --user-pool-id ${USER_POOL_ID} \
                --username ${email} \
                --region ${REGION}
                
            if [ $? -eq 0 ]; then
                echo -e "  ✓ User confirmed and ready for testing"
            else
                echo -e "  ${RED}⚠️ Failed to confirm user${NC}"
            fi
        else
            echo -e "  ${RED}⚠️ Failed to set permanent password${NC}"
        fi
    else
        echo -e "  ${RED}❌ Failed to create user${NC}"
    fi
    echo ""
}

# Test user credentials
# Using strong passwords that meet Cognito requirements
TEMP_PASSWORD="TempPass123!"
FINAL_PASSWORD="TestPass123!"

echo -e "${GREEN}Creating 10 test users for comprehensive load testing...${NC}"
echo ""

# Create test users
create_user "testuser1@k6loadtest.com" "TestUser1" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser2@k6loadtest.com" "TestUser2" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser3@k6loadtest.com" "TestUser3" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser4@k6loadtest.com" "TestUser4" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser5@k6loadtest.com" "TestUser5" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser6@k6loadtest.com" "TestUser6" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser7@k6loadtest.com" "TestUser7" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser8@k6loadtest.com" "TestUser8" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser9@k6loadtest.com" "TestUser9" ${TEMP_PASSWORD} ${FINAL_PASSWORD}
create_user "testuser10@k6loadtest.com" "TestUser10" ${TEMP_PASSWORD} ${FINAL_PASSWORD}

echo -e "${GREEN}🎉 Test user creation completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Update k6-tests/config.js with the new user credentials"
echo -e "2. Update auth-helper.js to use real Cognito authentication"
echo -e "3. Run the k6 load tests with: k6 run master-load-test.js"
echo ""
echo -e "${YELLOW}🔐 Test User Credentials:${NC}"
echo -e "Email: testuser1@k6loadtest.com to testuser10@k6loadtest.com"
echo -e "Password: ${FINAL_PASSWORD}"
echo ""
echo -e "${RED}⚠️ Important:${NC}"
echo -e "- These are test users with a common password"
echo -e "- Only use in test/staging environments"
echo -e "- Delete these users after testing if needed"