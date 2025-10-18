# ⚡ Quick Deployment Guide

**Want to deploy in 5 minutes? Follow this guide!**

## 🚀 Option 1: Using Deployment Script (Easiest)

```bash
./deploy.sh
```

Select option 3 (Both Backend + Frontend), then follow the prompts.

## 🎯 Option 2: Manual Deployment (Step by Step)

### Backend Deployment

```bash
# 1. Install Vercel CLI (if not installed)
npm install -g vercel

# 2. Deploy backend
cd backend
vercel --prod
```

**Set these environment variables in Vercel Dashboard:**
- `MONGODB_URI` = Your MongoDB Atlas connection string
- `JWT_SECRET` = Random 32+ character string
- `JWT_EXPIRE` = `7d`
- `NODE_ENV` = `production`
- `FRONTEND_URL` = (Set after frontend deployment)

### Frontend Deployment

```bash
# Deploy frontend
cd ../frontend
vercel --prod
```

**Set this environment variable in Vercel Dashboard:**
- `VITE_API_URL` = `https://your-backend.vercel.app/api`

### Final Step

Go back to **Backend** project in Vercel Dashboard:
- Add `FRONTEND_URL` = `https://your-frontend.vercel.app`
- **Redeploy** the backend

## ✅ Testing

1. Visit your frontend URL
2. Register a new account
3. Login
4. Try creating a book
5. Try creating an order

## 📖 Need More Details?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive instructions.

## 🆘 Having Issues?

**CORS Errors?**
- Ensure `FRONTEND_URL` is set on backend
- Redeploy backend after setting the variable

**MongoDB Connection Failed?**
- Check `MONGODB_URI` is correct
- In MongoDB Atlas, allow connections from `0.0.0.0/0`

**500 Errors?**
- Check Vercel logs in Dashboard → Logs
- Ensure all environment variables are set

---

**Your Apps:**

After deployment, you'll have:
- 🔧 Backend: `https://your-backend.vercel.app`
- 🎨 Frontend: `https://your-frontend.vercel.app`

Test health: `https://your-backend.vercel.app/api/health`
