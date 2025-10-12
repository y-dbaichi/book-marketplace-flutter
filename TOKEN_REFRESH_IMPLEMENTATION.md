# Token Refresh Mechanism - Implementation Guide

## Overview
A comprehensive token refresh mechanism has been implemented to automatically refresh JWT tokens before they expire, ensuring uninterrupted user sessions.

## Changes Made

### 1. Backend API (`backend/routes/auth.js`)
**New Endpoint:** `POST /api/auth/refresh`
- Requires valid JWT token in Authorization header
- Returns new token with 7-day expiration
- Returns updated user data

```javascript
// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
```

### 2. Flutter Constants (`lib/utils/constants.dart`)
**Added:**
- `refreshEndpoint = '/auth/refresh'`
- `tokenExpiryKey = 'token_expiry'`

### 3. Secure Storage Service (`lib/utils/secure_storage.dart`)
**New Methods:**
- `getTokenExpiry()` - Retrieves token expiration date
- `isTokenExpired()` - Checks if token is expired
- `shouldRefreshToken()` - Returns true if token expires within 1 day

**Updated Methods:**
- `saveToken()` - Now saves token expiry date (7 days from now)
- `deleteToken()` - Now also deletes token expiry data

### 4. API Service (`lib/services/api_service.dart`)
**Auto-Refresh Logic:**
- **Proactive Refresh:** Before each request, checks if token needs refresh (expires within 1 day)
- **Reactive Refresh:** On 401 error, attempts token refresh and retries original request
- Uses separate Dio instance for refresh to avoid interceptor loops
- Prevents multiple simultaneous refresh attempts with `_isRefreshing` flag

**Key Features:**
```dart
- Automatic token refresh before API calls
- Retry failed requests after token refresh
- Fallback to logout if refresh fails
```

### 5. Auth Service (`lib/services/auth_service.dart`)
**New Methods:**
- `refreshToken()` - Manual token refresh
- `checkTokenValidity()` - Validates token and refreshes if needed

### 6. Main App (`lib/main.dart`)
**Updated:**
- App startup now checks token validity
- Automatically refreshes expired tokens on app launch
- Redirects to login if token is invalid or refresh fails

## How It Works

### Automatic Refresh Flow

```
1. User makes API request
   ↓
2. ApiService interceptor checks: shouldRefreshToken()?
   ↓
3. If yes → Refresh token proactively
   ↓
4. Continue with original request
```

### Error Recovery Flow

```
1. API request returns 401 Unauthorized
   ↓
2. ApiService attempts token refresh
   ↓
3. If successful → Retry original request with new token
   ↓
4. If failed → Clear auth data → Redirect to login
```

### Token Lifecycle

```
Token Created
  ↓
7 Days Expiration
  ↓
Day 6 (24 hours before expiry)
  ↓
Auto-refresh triggered
  ↓
New token created (7 more days)
```

## Testing Instructions

### Test 1: Normal Token Refresh
1. Start the backend server: `cd backend && npm start`
2. Run the Flutter app: `flutter run`
3. Login with valid credentials
4. Wait for app to sync (watch console for refresh logs)
5. Check console for: `⏰ Token about to expire, refreshing...`

### Test 2: Expired Token Handling
1. Login to the app
2. Manually set token expiry to past date in secure storage
3. Make an API call (e.g., sync data)
4. Check console for: `🔄 401 Error - Attempting token refresh...`
5. Verify request succeeds after refresh

### Test 3: Failed Refresh
1. Login to the app
2. Stop the backend server
3. Make an API call
4. Verify app logs user out and redirects to login

### Test 4: App Startup Token Check
1. Login to the app
2. Close app completely
3. Set system clock forward by 6 days
4. Reopen app
5. Verify token is automatically refreshed on startup

## Console Log Messages

### Success Messages
- `✅ Token refreshed successfully` - Token refresh succeeded
- `♻️ Retrying original request with refreshed token` - Request retry after refresh

### Warning Messages
- `⏰ Token about to expire, refreshing...` - Proactive refresh triggered
- `🔄 401 Error - Attempting token refresh...` - Reactive refresh on error

### Error Messages
- `❌ Token refresh failed` - Refresh failed
- `❌ Token refresh error: [error]` - Specific error details
- `⚠️ Token is expired` - Token expired, logout triggered

## Configuration

### Token Expiration (Backend)
Change in `backend/routes/auth.js`:
```javascript
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'  // Change this value
  });
};
```

### Refresh Threshold (Flutter)
Change in `lib/utils/secure_storage.dart`:
```dart
Future<bool> shouldRefreshToken() async {
  final expiry = await getTokenExpiry();
  if (expiry == null) return false;

  // Refresh if token expires within 1 day (change Duration here)
  final oneDayBeforeExpiry = expiry.subtract(const Duration(days: 1));
  return DateTime.now().isAfter(oneDayBeforeExpiry);
}
```

## Security Considerations

1. **Token Storage:** Tokens are stored in Flutter Secure Storage (encrypted)
2. **Refresh Security:** Refresh endpoint requires valid token (not a separate refresh token)
3. **Token Rotation:** Each refresh generates a new token with new expiration
4. **Auto-Logout:** Failed refresh automatically logs user out

## Troubleshooting

### Issue: Token not refreshing automatically
**Solution:** Check console logs for `shouldRefreshToken()` return value

### Issue: 401 errors persist after refresh
**Solution:** Verify backend `/auth/refresh` endpoint is working

### Issue: App keeps logging out
**Solution:** Check backend is running and JWT_SECRET is correct

### Issue: Token expiry not saved
**Solution:** Verify `saveToken()` is being called after login

## API Endpoint Reference

### POST /api/auth/refresh
**Headers:**
```
Authorization: Bearer <current-token>
Content-Type: application/json
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "...",
    "userType": "buyer",
    "phone": "...",
    "location": {...},
    "profile": {...}
  }
}
```

**Response (401):**
```json
{
  "message": "Token is not valid"
}
```

## Next Steps

1. Test the implementation thoroughly
2. Monitor refresh logs in production
3. Consider implementing refresh token pattern for enhanced security
4. Add analytics to track token refresh frequency

## Files Modified

- ✅ `backend/routes/auth.js` - Added refresh endpoint
- ✅ `lib/utils/constants.dart` - Added refresh endpoint constant
- ✅ `lib/utils/secure_storage.dart` - Added token expiry tracking
- ✅ `lib/services/api_service.dart` - Added auto-refresh interceptors
- ✅ `lib/services/auth_service.dart` - Added refresh methods
- ✅ `lib/main.dart` - Added startup token validation

---

**Implementation Status:** ✅ Complete
**Ready for Testing:** Yes
**Documentation:** Complete
