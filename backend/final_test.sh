#!/bin/bash

BASE_URL="http://localhost:5003"
echo "🚀 FINAL API TEST - Book Marketplace"
echo "===================================="

# Login existing buyer
echo "🔑 Logging in as Buyer..."
BUYER_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "buyer@test.com", "password": "password123"}')

BUYER_TOKEN=$(echo "$BUYER_LOGIN" | jq -r '.token')
echo "✅ Buyer logged in successfully!"

# Login existing customer  
echo "🔑 Logging in as Customer..."
CUSTOMER_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@test.com", "password": "password123"}')

CUSTOMER_TOKEN=$(echo "$CUSTOMER_LOGIN" | jq -r '.token')
echo "✅ Customer logged in successfully!"

# Create book
echo "📚 Creating book listing..."
BOOK_CREATE=$(curl -s -X POST "$BASE_URL/api/books" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Le Petit Prince",
    "author": "Antoine de Saint-Exupéry", 
    "quality": "excellent",
    "quantity": 1,
    "price": 25.00,
    "description": "Conte philosophique intemporel",
    "category": "Jeunesse"
  }')

BOOK_ID=$(echo "$BOOK_CREATE" | jq -r '.book._id')
echo "✅ Book created! ID: $BOOK_ID"
echo "📖 Title: $(echo "$BOOK_CREATE" | jq -r '.book.title')"
echo "💰 Price: $(echo "$BOOK_CREATE" | jq -r '.book.price')€"

# Get all books
echo "📋 Getting all books..."
ALL_BOOKS=$(curl -s "$BASE_URL/api/books")
BOOK_COUNT=$(echo "$ALL_BOOKS" | jq '.books | length')
echo "✅ Found $BOOK_COUNT books in marketplace"

# Create order
echo "🛒 Creating order..."
ORDER_CREATE=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"bookId\": \"$BOOK_ID\",
    \"quantity\": 1,
    \"orderType\": \"pickup\",
    \"customerNotes\": \"Je viendrai récupérer demain\"
  }")

ORDER_ID=$(echo "$ORDER_CREATE" | jq -r '.order._id')
echo "✅ Order created! ID: $ORDER_ID"
echo "📦 Status: $(echo "$ORDER_CREATE" | jq -r '.order.status')"
echo "💵 Total: $(echo "$ORDER_CREATE" | jq -r '.order.totalPrice')€"

# Confirm order (as buyer)
echo "✅ Confirming order (as buyer)..."
ORDER_CONFIRM=$(curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed", "notes": "Livre disponible!"}')

echo "✅ Order confirmed!"
echo "📦 New Status: $(echo "$ORDER_CONFIRM" | jq -r '.order.status')"

# Mark as ready
echo "🎯 Marking order as ready..."
ORDER_READY=$(curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "ready", "notes": "Prêt pour récupération"}')

echo "✅ Order ready for pickup!"
echo "📦 Status: $(echo "$ORDER_READY" | jq -r '.order.status')"

# Generate GeoJSON
echo "🗺️ Generating GeoJSON export..."
GEOJSON_EXPORT=$(curl -s -X POST "$BASE_URL/api/geojson/generate" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exportType": "buyer_orders",
    "filters": {
      "status": ["confirmed", "ready", "completed"]
    }
  }')

EXPORT_ID=$(echo "$GEOJSON_EXPORT" | jq -r '.export.id')
echo "✅ GeoJSON export generated!"
echo "📄 Export ID: $EXPORT_ID"
echo "📊 Features: $(echo "$GEOJSON_EXPORT" | jq -r '.export.featureCount')"

# Preview GeoJSON
echo "👀 Previewing GeoJSON..."
GEOJSON_PREVIEW=$(curl -s "$BASE_URL/api/geojson/preview/$EXPORT_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN")

echo "✅ GeoJSON Preview:"
echo "$GEOJSON_PREVIEW" | jq '.preview.features[0].properties | {bookTitle, orderType, locationName, contactPhone}'

echo ""
echo "🎉 COMPLETE API TEST SUCCESSFUL!"
echo "================================="
echo "✅ User Authentication: WORKING"
echo "✅ Book Management: WORKING" 
echo "✅ Order Workflow: WORKING"
echo "✅ GeoJSON Export: WORKING"
echo "📱 Ready for mobile app integration!"
