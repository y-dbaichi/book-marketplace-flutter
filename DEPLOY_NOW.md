# 🚀 Deploy Now - Step by Step

**Everything is ready! Just follow these simple steps:**

---

## Step 1: Deploy Using the Script

Open your terminal in this directory and run:

```bash
./deploy.sh
```

When prompted:
1. **Login to Vercel** - Browser will open, login with your Vercel account
2. **Choose option 3** - Deploy both Backend + Frontend
3. **Follow the prompts** - Accept the defaults

The script will give you two URLs:
- Backend: `https://something.vercel.app`
- Frontend: `https://something-else.vercel.app`

**Write down these URLs!** You'll need them for the next step.

---

## Step 2: Set Environment Variables

### For Backend Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **backend** project (book-marketplace-api or similar)
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
MONGODB_URI
Value: mongodb+srv://anasabounouar:anas.200377@cluster.egdexnj.mongodb.net/bookmarketplace?retryWrites=true&w=majority&appName=Cluster
Environment: Production

JWT_SECRET
Value: your-super-secret-jwt-key-min-32-chars-change-this-now-please-make-it-random
Environment: Production

JWT_EXPIRE
Value: 7d
Environment: Production

NODE_ENV
Value: production
Environment: Production

FRONTEND_URL
Value: https://your-frontend-url.vercel.app (from Step 1)
Environment: Production
```

### For Frontend Project

1. In Vercel Dashboard, click on your **frontend** project
2. Go to **Settings** → **Environment Variables**
3. Add this variable:

```
VITE_API_URL
Value: https://your-backend-url.vercel.app/api (from Step 1)
Environment: Production
```

---

## Step 3: Redeploy Both Projects

After setting environment variables:

1. Go to **Backend project** → **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy** → **Use existing Build Cache**

4. Go to **Frontend project** → **Deployments** tab
5. Click the **⋯** (three dots) on the latest deployment
6. Click **Redeploy** → **Use existing Build Cache**

---

## Step 4: Test Your Deployment

### Test Backend:

Open in browser:
```
https://your-backend-url.vercel.app/api/health
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

### Test Frontend:

1. Open `https://your-frontend-url.vercel.app`
2. Click **Register**
3. Create a new account
4. Login
5. Try browsing the marketplace

---

## ✅ You're Done!

Your application is now live on:
- **Backend**: https://your-backend-url.vercel.app
- **Frontend**: https://your-frontend-url.vercel.app

---

## 🆘 If Something Goes Wrong

### CORS Errors:
- Make sure `FRONTEND_URL` is set correctly in backend
- Make sure you redeployed the backend after setting it

### MongoDB Connection Failed:
- Check your MongoDB Atlas is running
- In MongoDB Atlas → Network Access → Add IP: `0.0.0.0/0`
- Check `MONGODB_URI` is correct

### 500 Errors:
- Go to Vercel Dashboard → Your Project → **Logs**
- Check for error messages
- Make sure all environment variables are set

### Can't Login:
- Clear browser localStorage (F12 → Application → Clear Storage)
- Make sure `JWT_SECRET` is set on backend
- Check backend logs

---

## 📞 MongoDB Atlas Network Access

**IMPORTANT**: MongoDB Atlas needs to allow Vercel's IP addresses.

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click on your cluster
3. Go to **Network Access** (left sidebar)
4. Click **Add IP Address**
5. Click **Allow Access from Anywhere** → Enter `0.0.0.0/0`
6. Click **Confirm**

This allows Vercel's serverless functions to connect to your database.

---

**That's it! Start with Step 1 and you'll be deployed in 5 minutes! 🎉**
