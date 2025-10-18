# 🚀 Vercel Deployment Guide

This guide will walk you through deploying the Book Marketplace application to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub (recommended)
3. **MongoDB Atlas**: Ensure you have a MongoDB Atlas cluster running
4. **Environment Variables**: Have your `.env` values ready

---

## 🔧 Part 1: Deploy Backend API

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Deploy Backend

**Option A: Using Vercel Dashboard (Recommended)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select the **backend** directory as the root directory
4. Vercel will auto-detect it as a Node.js project
5. Click **Deploy**

**Option B: Using Vercel CLI**

```bash
cd backend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? `book-marketplace-api`
- In which directory is your code located? `./`

### Step 3: Configure Backend Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://username:password@cluster.mongodb.net/bookmarketplace` | Production |
| `JWT_SECRET` | `your-super-secret-jwt-key-min-32-characters-long` | Production |
| `JWT_EXPIRE` | `7d` | Production |
| `NODE_ENV` | `production` | Production |
| `FRONTEND_URL` | `https://your-frontend-app.vercel.app` (will add after frontend deployment) | Production |

**Important**:
- Use a **strong, random JWT_SECRET** (minimum 32 characters)
- Get MongoDB URI from MongoDB Atlas dashboard
- You'll update `FRONTEND_URL` after deploying the frontend

### Step 4: Test Backend Deployment

After deployment, Vercel will give you a URL like:
```
https://book-marketplace-api.vercel.app
```

Test the health endpoint:
```bash
curl https://your-backend-url.vercel.app/api/health
```

You should see:
```json
{
  "success": true,
  "message": "Book Marketplace API is running!",
  "environment": "production",
  "mongodb": "connected"
}
```

---

## 🎨 Part 2: Deploy Frontend (React)

### Step 1: Deploy Frontend

**Using Vercel Dashboard (Recommended)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository (or same repo)
3. Select the **frontend** directory as the root directory
4. Vercel will auto-detect it as a Vite project
5. Click **Deploy**

**Using Vercel CLI**

```bash
cd frontend
vercel
```

### Step 2: Configure Frontend Environment Variables

In Vercel Dashboard → Frontend Project → Settings → Environment Variables, add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://your-backend-url.vercel.app/api` | Production |

**Important**: Replace `your-backend-url` with your actual backend Vercel URL from Step 1.

### Step 3: Update Backend CORS

Now that you have your frontend URL, go back to:

**Backend Project → Settings → Environment Variables**

Add/Update:
- `FRONTEND_URL` = `https://your-frontend-app.vercel.app`

Then **Redeploy** the backend:
- Go to Deployments tab
- Click the three dots on the latest deployment
- Click "Redeploy"

### Step 4: Test Frontend

Visit your frontend URL:
```
https://your-frontend-app.vercel.app
```

Try to:
1. Register a new account
2. Login
3. Browse books
4. Create an order

---

## 📱 Part 3: Flutter Web (Optional)

If you want to deploy the Flutter app as a web application:

### Step 1: Build Flutter Web

```bash
cd ..  # Go to root directory
flutter build web
```

This creates a `build/web` directory.

### Step 2: Deploy Flutter Web to Vercel

**Create vercel.json in root:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "build/web/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/build/web/$1"
    }
  ]
}
```

**Deploy:**

```bash
vercel --prod
```

---

## 🔒 Security Checklist

Before going to production, ensure:

- ✅ **Strong JWT_SECRET**: Minimum 32 random characters
- ✅ **MongoDB Network Access**: Add Vercel IP ranges (or use 0.0.0.0/0 for serverless)
- ✅ **CORS Configuration**: Only your frontend URL is whitelisted
- ✅ **Rate Limiting**: Enabled (already configured)
- ✅ **HTTPS**: Vercel provides this automatically
- ✅ **Environment Variables**: Never commit `.env` files to git

### MongoDB Atlas Network Access

In MongoDB Atlas:
1. Go to Network Access
2. For Vercel serverless functions, you need to allow all IPs: `0.0.0.0/0`
3. Or add specific Vercel IP ranges (check Vercel documentation)

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: MongoDB connection fails
```
Solution:
1. Check MONGODB_URI is correct
2. Ensure MongoDB Atlas allows connections from 0.0.0.0/0
3. Check MongoDB Atlas user has correct permissions
```

**Problem**: CORS errors
```
Solution:
1. Ensure FRONTEND_URL is set correctly
2. Redeploy backend after adding FRONTEND_URL
3. Check browser console for exact error
```

**Problem**: 500 Internal Server Error
```
Solution:
1. Check Vercel logs: Dashboard → Project → Logs
2. Ensure all environment variables are set
3. Check MongoDB connection
```

### Frontend Issues

**Problem**: API requests fail
```
Solution:
1. Check VITE_API_URL is correct (must include /api)
2. Ensure backend is deployed and healthy
3. Check CORS configuration on backend
```

**Problem**: 401 Unauthorized errors
```
Solution:
1. Clear browser localStorage
2. Try registering a new account
3. Check JWT_SECRET is set on backend
```

**Problem**: Blank page
```
Solution:
1. Check browser console for errors
2. Ensure vercel.json routes are correct
3. Check Vercel build logs
```

---

## 📊 Monitoring

### Vercel Analytics

Enable analytics in Vercel Dashboard:
1. Go to your project
2. Click "Analytics" tab
3. Enable Web Analytics

### Health Check Monitoring

Set up a monitoring service (like UptimeRobot) to ping:
```
https://your-backend-url.vercel.app/api/health
```

This ensures your API stays responsive.

---

## 🔄 CI/CD (Automatic Deployments)

When you connect your GitHub repository to Vercel:

1. **Push to main branch** → Automatic production deployment
2. **Push to other branches** → Preview deployments
3. **Pull requests** → Automatic preview URLs

### GitHub Integration

In Vercel Dashboard:
1. Project Settings → Git
2. Connect your GitHub repository
3. Configure:
   - Production Branch: `main`
   - Root Directory: `backend` or `frontend`

---

## 📝 Post-Deployment Steps

1. **Update README**: Add your production URLs
2. **Test All Features**: Go through complete user flows
3. **Monitor Logs**: Check Vercel logs for errors
4. **Set Up Alerts**: Configure error notifications
5. **Backup Data**: Set up MongoDB Atlas backups

---

## 🌐 Your Deployment URLs

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | `https://your-backend.vercel.app` | REST API |
| **Health Check** | `https://your-backend.vercel.app/api/health` | Status monitoring |
| **Frontend** | `https://your-frontend.vercel.app` | Customer/Buyer interface |
| **Flutter Web** | `https://your-flutter.vercel.app` | Seller mobile interface |

---

## 💡 Pro Tips

### 1. Custom Domains

In Vercel Dashboard → Project → Settings → Domains:
- Add your custom domain (e.g., `api.bookmarketplace.com`)
- Vercel provides free SSL certificates

### 2. Preview Deployments

Every git branch gets its own preview URL:
- Test features before merging to main
- Share with team members for review

### 3. Environment Variables per Branch

You can set different variables for:
- **Production**: `main` branch
- **Preview**: All other branches
- **Development**: Local `.env` file

### 4. Vercel Functions Limits

Free tier limits:
- **Execution Time**: 10 seconds per function
- **Bandwidth**: 100GB/month
- **Invocations**: Unlimited

For production, consider upgrading to Pro.

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

## 📞 Need Help?

If you encounter issues:

1. Check Vercel logs: Dashboard → Project → Logs
2. Review this guide's troubleshooting section
3. Check MongoDB Atlas logs
4. Review browser console errors
5. Test API endpoints with curl or Postman

---

**Deployment Checklist:**

- [ ] Backend deployed to Vercel
- [ ] Backend environment variables configured
- [ ] Backend health check returns success
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables configured
- [ ] Frontend can connect to backend API
- [ ] CORS configured correctly
- [ ] MongoDB Atlas network access configured
- [ ] Test registration and login
- [ ] Test creating and viewing books
- [ ] Test creating and managing orders
- [ ] Set up monitoring/alerts

---

**Generated with 💙 for Book Marketplace**
