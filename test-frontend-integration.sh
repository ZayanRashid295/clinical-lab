#!/bin/bash

# Frontend Integration Test Script
# Tests the frontend checkout flow programmatically

echo "🧪 Frontend Integration Testing"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend is accessible
echo "1️⃣ Testing Backend Accessibility..."
if curl -s http://localhost:3000/api/docs > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Backend is not accessible${NC}"
    exit 1
fi

# Test 2: Frontend is accessible
echo ""
echo "2️⃣ Testing Frontend Accessibility..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running on http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible${NC}"
    exit 1
fi

# Test 3: Authentication
echo ""
echo "3️⃣ Testing Authentication..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uber.com","password":"password123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Authentication failed${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Authentication successful${NC}"
    echo "   Token: ${TOKEN:0:30}..."
fi

# Test 4: Payment Creation (what frontend would do)
echo ""
echo "4️⃣ Testing Payment Creation (Frontend API Call)..."
PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "cmhuitzu8000mgi5f2i8ttpk4",
    "subscriptionPackageId": "cmhuiu0kv00olgi5f99c8kf4o",
    "description": "Basic Qbank subscription"
  }')

PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | grep -o '"paymentId":"[^"]*"' | cut -d'"' -f4)
CLIENT_SECRET=$(echo "$PAYMENT_RESPONSE" | grep -o '"clientSecret":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Payment creation failed${NC}"
    echo "   Response: $PAYMENT_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✅ Payment created successfully${NC}"
    echo "   Payment ID: $PAYMENT_ID"
    echo "   Client Secret: ${CLIENT_SECRET:0:30}..."
fi

# Test 5: Checkout Page Accessibility
echo ""
echo "5️⃣ Testing Checkout Page..."
CHECKOUT_RESPONSE=$(curl -s http://localhost:3001/checkout-basic)

if echo "$CHECKOUT_RESPONSE" | grep -q "checkout\|Stripe\|Basic Qbank"; then
    echo -e "${GREEN}✅ Checkout page is accessible${NC}"
else
    if echo "$CHECKOUT_RESPONSE" | grep -q "Configuration Required\|Stripe publishable key"; then
        echo -e "${YELLOW}⚠️  Checkout page accessible but Stripe key not configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Checkout page response: ${CHECKOUT_RESPONSE:0:100}...${NC}"
    fi
fi

# Test 6: Webhook Processing
echo ""
echo "6️⃣ Testing Webhook Processing..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:3000/payments/webhook/stripe \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"payment_intent.succeeded\",
    \"data\": {
      \"object\": {
        \"id\": \"${CLIENT_SECRET%%_*}\",
        \"status\": \"succeeded\",
        \"amount\": 4999,
        \"currency\": \"usd\",
        \"metadata\": {
          \"userId\": \"cmhuitzu8000mgi5f2i8ttpk4\",
          \"subscriptionPackageId\": \"cmhuiu0kv00olgi5f99c8kf4o\"
        }
      }
    }
  }")

if echo "$WEBHOOK_RESPONSE" | grep -q "received\|true"; then
    echo -e "${GREEN}✅ Webhook processed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Webhook response: $WEBHOOK_RESPONSE${NC}"
fi

# Test 7: Verify Subscription Created
echo ""
echo "7️⃣ Verifying Subscription Creation..."
SUBSCRIPTION_RESPONSE=$(curl -s -X GET "http://localhost:3000/subscriptions?userId=cmhuitzu8000mgi5f2i8ttpk4&status=ACTIVE" \
  -H "Authorization: Bearer $TOKEN")

if echo "$SUBSCRIPTION_RESPONSE" | grep -q "ACTIVE"; then
    echo -e "${GREEN}✅ Active subscription found${NC}"
else
    echo -e "${YELLOW}⚠️  No active subscription found${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Frontend Integration Tests Complete${NC}"
echo ""






























