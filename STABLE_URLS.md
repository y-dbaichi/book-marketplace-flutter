# 🌐 Stable Production URLs

**Last Updated:** 2025-10-18

---

## ✅ Your Permanent URLs

### Frontend (User App)
**URL:** https://marketplace-books.vercel.app

**Use for:**
- Sharing with users
- Marketing materials
- Testing
- Mobile app configuration

---

### Backend API
**URL:** https://book-marketplace-api.vercel.app

**Health Check:** https://book-marketplace-api.vercel.app/api/health

**Use for:**
- Frontend API calls
- Mobile app configuration
- Third-party integrations

---

## 🎯 These URLs Will NEVER Change

No matter how many times you redeploy, these URLs stay the same!

The random URLs like `backend-7xxn7jvuf-anasabounouars-projects.vercel.app` will still work, but they're just preview URLs. Your stable URLs above are what you should use everywhere.

---

## 📝 Configuration Summary

### Backend Environment Variables
```
MONGODB_URI=mongodb+srv://anasabounouar:anas.200377@cluster.egdexnj.mongodb.net/bookmarketplace
JWT_SECRET=book-marketplace-super-secret-jwt-key-2025
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://marketplace-books.vercel.app
```

### Frontend Environment Variables
```
VITE_API_URL=https://book-marketplace-api.vercel.app/api
```

---

## 🔧 Update Flutter Mobile App

When configuring your Flutter app to use the production backend, update:

**File:** `lib/utils/constants.dart`

```dart
static const String baseUrl = 'https://book-marketplace-api.vercel.app/api';
```

---

## 🧪 Testing

### Test Backend Health
```bash
curl https://book-marketplace-api.vercel.app/api/health
```

**Expected Response (after MongoDB is configured):**
```json
{
  "success": true,
  "message": "Book Marketplace API is running!",
  "timestamp": "2025-10-18T...",
  "environment": "production",
  "uptime": 123.45,
  "mongodb": "connected"
}
```

### Test Frontend
Open in browser: https://marketplace-books.vercel.app

**Test Login:**
- Email: `seller1@gmail.com`
- Password: `aaaaaa`

---

## 📊 Vercel Dashboard Links

### Backend Project
- **Dashboard:** https://vercel.com/anasabounouars-projects/backend
- **Domains:** https://vercel.com/anasabounouars-projects/backend/settings/domains
- **Environment:** https://vercel.com/anasabounouars-projects/backend/settings/environment-variables
- **Deployments:** https://vercel.com/anasabounouars-projects/backend/deployments

### Frontend Project
- **Dashboard:** https://vercel.com/anasabounouars-projects/frontend
- **Domains:** https://vercel.com/anasabounouars-projects/frontend/settings/domains
- **Environment:** https://vercel.com/anasabounouars-projects/frontend/settings/environment-variables
- **Deployments:** https://vercel.com/anasabounouars-projects/frontend/deployments

---

## 💡 Why These Names?

Your preferred names were already taken by other Vercel users:
- ❌ `bookstore.vercel.app` (taken)
- ❌ `bookstore-api.vercel.app` (taken)

Alternative stable names assigned:
- ✅ `marketplace-books.vercel.app` (frontend)
- ✅ `book-marketplace-api.vercel.app` (backend)

If you want completely custom domains, you can:
1. Register a domain (e.g., `yourbookstore.com`)
2. Add it to Vercel in the Domains settings
3. Use `www.yourbookstore.com` and `api.yourbookstore.com`

---

## 🚀 Next Steps

1. **Configure MongoDB Network Access** (1 minute)
   - Go to: https://cloud.mongodb.com
   - Network Access → Add `0.0.0.0/0`

2. **Test the stable URLs** (1 minute)
   - Health check should show `"mongodb": "connected"`
   - Frontend should allow login

3. **Share your app!**
   - Your marketplace is live at: https://marketplace-books.vercel.app

---

**Status:** ✅ Stable URLs Active | ⚠️ MongoDB Configuration Needed
