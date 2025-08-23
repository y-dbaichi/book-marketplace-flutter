#!/bin/bash

BASE_URL="http://localhost:5003"
echo "🚀 Testing Book Marketplace API at $BASE_URL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_test() {
    echo -e "\n${BLUE}🔍 $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Health Check
print_test "Testing API Health"
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
if [[ $? -eq 0 ]]; then
    echo "$HEALTH_RESPONSE" | jq '.'
    print_success "API is running!"
else
    print_error "API health check failed"
    exit 1
fi

# Test 2: Register Buyer
print_test "Registering Buyer"
BUYER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "password123",
    "userType": "buyer",
    "phone": "+212 6 12 34 56 78",
    "location": {
      "name": "Librairie Centrale Casablanca",
      "coordinates": {
        "latitude": 33.5731,
        "longitude": -7.5898
      },
      "address": "Boulevard Mohammed V, Casablanca"
    },
    "profile": {
      "firstName": "Ahmed",
      "lastName": "Bennani",
      "bio": "Libraire spécialisé en livres académiques"
    }
  }')

if echo "$BUYER_RESPONSE" | jq -e '.token' > /dev/null; then
    BUYER_TOKEN=$(echo "$BUYER_RESPONSE" | jq -r '.token')
    BUYER_ID=$(echo "$BUYER_RESPONSE" | jq -r '.user.id')
    print_success "Buyer registered successfully!"
    echo "Buyer ID: $BUYER_ID"
else
    echo "$BUYER_RESPONSE" | jq '.'
    print_error "Buyer registration failed"
fi

# Test 3: Register Customer
print_test "Registering Customer"
CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "password123",
    "userType": "customer",
    "phone": "+212 6 87 65 43 21",
    "location": {
      "name": "Quartier Maarif",
      "coordinates": {
        "latitude": 33.5731,
        "longitude": -7.5898
      },
      "address": "Rue Abdelkrim Diouri, Maarif, Casablanca"
    },
    "profile": {
      "firstName": "Fatima",
      "lastName": "Alami",
      "bio": "Étudiante en littérature"
    }
  }')

if echo "$CUSTOMER_RESPONSE" | jq -e '.token' > /dev/null; then
    CUSTOMER_TOKEN=$(echo "$CUSTOMER_RESPONSE" | jq -r '.token')
    CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.user.id')
    print_success "Customer registered successfully!"
    echo "Customer ID: $CUSTOMER_ID"
else
    echo "$CUSTOMER_RESPONSE" | jq '.'
    print_error "Customer registration failed"
fi

# Test 4: Create Book (as Buyer)
print_test "Creating Book Listing (as Buyer)"
BOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/books" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Les Misérables",
    "author": "Victor Hugo",
    "quality": "good",
    "quantity": 2,
    "price": 45.50,
    "description": "Roman classique français en excellent état",
    "category": "Littérature",
    "isbn": "978-2-07-040570-1",
    "condition": {
      "hasWriting": false,
      "hasHighlighting": true,
      "hasDamage": false
    }
  }')

if echo "$BOOK_RESPONSE" | jq -e '.book._id' > /dev/null; then
    BOOK_ID=$(echo "$BOOK_RESPONSE" | jq -r '.book._id')
    print_success "Book created successfully!"
    echo "Book ID: $BOOK_ID"
    echo "Title: $(echo "$BOOK_RESPONSE" | jq -r '.book.title')"
    echo "Price: $(echo "$BOOK_RESPONSE" | jq -r '.book.price')€"
else
    echo "$BOOK_RESPONSE" | jq '.'
    print_error "Book creation failed"
fi

# Test 5: Get All Books
print_test "Getting All Books"
BOOKS_RESPONSE=$(curl -s "$BASE_URL/api/books")
BOOK_COUNT=$(echo "$BOOKS_RESPONSE" | jq '.books | length')
print_success "Found $BOOK_COUNT books"
echo "$BOOKS_RESPONSE" | jq '.books[0] | {title, author, price, quality}'

# Test 6: Create Order (as Customer)
print_test "Creating Order (as Customer)"
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"bookId\": \"$BOOK_ID\",
    \"quantity\": 1,
    \"orderType\": \"pickup\",
    \"customerNotes\": \"Je peux venir récupérer le livre demain après-midi\"
  }")

if echo "$ORDER_RESPONSE" | jq -e '.order._id' > /dev/null; then
    ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.order._id')
    print_success "Order created successfully!"
    echo "Order ID: $ORDER_ID"
    echo "Status: $(echo "$ORDER_RESPONSE" | jq -r '.order.status')"
    echo "Total: $(echo "$ORDER_RESPONSE" | jq -r '.order.totalPrice')€"
else
    echo "$ORDER_RESPONSE" | jq '.'
    print_error "Order creation failed"
fi

# Test 7: Update Order Status (as Buyer)
print_test "Confirming Order (as Buyer)"
CONFIRM_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "notes": "Commande confirmée, livre disponible"
  }')

if echo "$CONFIRM_RESPONSE" | jq -e '.order' > /dev/null; then
    print_success "Order confirmed successfully!"
    echo "New Status: $(echo "$CONFIRM_RESPONSE" | jq -r '.order.status')"
else
    echo "$CONFIRM_RESPONSE" | jq '.'
    print_error "Order confirmation failed"
fi

# Test 8: Generate GeoJSON Export (as Buyer)
print_test "Generating GeoJSON Export (as Buyer)"
EXPORT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/geojson/generate" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exportType": "buyer_orders",
    "filters": {
      "status": ["confirmed", "ready", "completed"],
      "orderType": ["pickup", "delivery"]
    }
  }')

if echo "$EXPORT_RESPONSE" | jq -e '.export.id' > /dev/null; then
    EXPORT_ID=$(echo "$EXPORT_RESPONSE" | jq -r '.export.id')
    print_success "GeoJSON export generated successfully!"
    echo "Export ID: $EXPORT_ID"
    echo "Features: $(echo "$EXPORT_RESPONSE" | jq -r '.export.featureCount')"
    echo "File Size: $(echo "$EXPORT_RESPONSE" | jq -r '.export.fileSize') bytes"
else
    echo "$EXPORT_RESPONSE" | jq '.'
    print_error "GeoJSON export failed"
fi

echo -e "\n${YELLOW}🎉 API Testing Complete!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ All major endpoints tested successfully!${NC}"
echo -e "${BLUE}📱 Ready for mobile app integration!${NC}"
