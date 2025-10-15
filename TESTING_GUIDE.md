# 🧪 Book Marketplace Testing & Debugging Guide

**Generated:** October 15, 2025
**Issue:** 500 Internal Server Error on Order Status Updates

---

## 📋 Summary of Issues Found

### ✅ Fixed Issues
1. **Populated Field Bug** in `backend/routes/orders.js` - The `order.book` field was populated but code tried to use it as an ID
   - **Fix Applied:** Lines 272 & 301 now handle both populated and non-populated cases
   ```javascript
   const bookId = order.book._id || order.book;
   ```

### ⚠️ Current Issues

1. **Backend Server Status**
   - ✅ Server IS running on port 5001 (PID: 8124)
   - ✅ Health endpoint works: `http://localhost:5001/api/health`
   - ✅ Books API works correctly

2. **Order Status Update** (The main issue you're seeing)
   - The fix has been applied to the code
   - Server needs to pick up the changes

---

## 🔧 Steps to Resolve

### Step 1: Restart Backend Server

Since nodemon isn't running, the server won't auto-reload. You need to manually restart:

```bash
# Kill existing server
pkill -f "node.*server.js"

# Start with nodemon for auto-reload (recommended)
cd /Users/anasabounouar/Documents/book-marketplace-flutter/backend
npm run dev

# OR start normally
npm start
```

### Step 2: Verify Server is Running

```bash
# Check health endpoint
curl http://localhost:5001/api/health

# Should return:
# {"message":"Book Marketplace API is running!","timestamp":"...","environment":"development"}
```

### Step 3: Test Order Status Update

#### Option A: Test via Frontend
1. Open browser to `http://localhost:5173`
2. Login as a seller
3. Go to Orders page
4. Try to confirm/refuse an order

#### Option B: Test via API (Postman/curl)
```bash
# 1. Login as seller
curl -X POST http://localhost:5001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "email": "YOUR_SELLER_EMAIL",
    "password": "YOUR_PASSWORD"
  }'

# 2. Get token from response, then update order
curl -X PUT http://localhost:5001/api/orders/ORDER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

---

## 📊 Testing Results

### ✅ Working Endpoints
- `GET /api/health` - Server health check
- `GET /api/books` - List all books
- `POST /api/auth/login` - User authentication (with valid credentials)

### ❌ Not Fully Tested
- `PUT /api/orders/:id/status` - Order status update (fix applied, needs server restart)
- `GET /api/orders/my/seller` - Get seller orders (needs valid auth token)
- `GET /api/orders/my/buyer` - Get buyer orders (needs valid auth token)

---

## 🐛 Debugging Tips

### Check Server Logs
```bash
# If running with npm start
# Logs appear in terminal

# If running in background
tail -f /tmp/book-server.log
```

### Common Errors & Solutions

#### 1. "Cannot GET /api/health"
**Cause:** Server not running
**Solution:** Start the server (see Step 1)

#### 2. "500 Internal Server Error" on order status update
**Cause:** Populated field bug (already fixed)
**Solution:** Restart server to apply fix

#### 3. "401 Unauthorized"
**Cause:** Invalid or missing token
**Solution:** Login again to get fresh token

#### 4. "EADDRINUSE: address already in use"
**Cause:** Another process on port 5001
**Solution:**
```bash
# Find and kill the process
lsof -ti:5001 | xargs kill
```

---

## 📝 Code Changes Made

### File: `backend/routes/orders.js`

**Lines 269-316:** Fixed order status update to handle populated book field

**Before:**
```javascript
const book = await Book.findById(order.book);
```

**After:**
```javascript
const bookId = order.book._id || order.book;
const book = await Book.findById(bookId);
```

This change was made in two places:
1. Line 272 - When confirming orders (decrementing stock)
2. Line 301 - When refusing orders (restoring stock)

---

## 🧪 Automated Testing

### Run Comprehensive Tests
```bash
cd backend
node test_comprehensive.js
```

### Expected Output
```
✓ Server Health Check
✓ Books API
✓ Authentication
✓ Get Orders
✓ Update Order Status
```

---

## 🔍 Next Steps

1. **Restart the backend server** to apply the fix
2. **Test order status update** in the browser
3. **Monitor console** for any remaining errors
4. **Check server logs** if issues persist

### If Problems Continue:

1. Check browser console for error details
2. Check server logs for stack traces
3. Verify the fix is present in `backend/routes/orders.js` lines 272 & 301
4. Ensure MongoDB connection is working
5. Verify user has correct permissions (seller can update their orders)

---

## 📞 Additional Support

### Useful Commands

```bash
# Check if server is running
lsof -i:5001

# View server process
ps aux | grep "node.*server"

# Test specific endpoint
curl -X GET http://localhost:5001/api/books

# Monitor server logs
tail -f backend/logs/*.log

# Check MongoDB connection
mongo "YOUR_MONGODB_URI" --eval "db.stats()"
```

### File Locations
- **Backend Server:** `/Users/anasabounouar/Documents/book-marketplace-flutter/backend/server.js`
- **Order Routes:** `/Users/anasabounouar/Documents/book-marketplace-flutter/backend/routes/orders.js`
- **Frontend App:** `/Users/anasabounouar/Documents/book-marketplace-flutter/frontend/`
- **Order Pages:** `frontend/src/pages/buyer/BuyerOrders.jsx`

---

## ✨ Summary

**Issue:** Order status updates were failing with 500 errors
**Root Cause:** Code tried to use populated `order.book` object as an ID
**Fix Applied:** Added logic to extract ID from populated or non-populated field
**Status:** **Fix complete - Server restart required**

Once you restart the server, the order status update feature should work correctly!
