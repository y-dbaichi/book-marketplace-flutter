# 🔑 Import Environment Variables to Vercel

I've created `.env.production` files for both backend and frontend with all the correct values!

---

## Option 1: Import Using Vercel CLI (Easiest!)

### Backend:
```bash
vercel env pull --cwd backend --environment production
```

Wait, actually Vercel CLI doesn't support importing .env files directly. Let me give you the manual method which is still super easy:

---

## Option 2: Copy-Paste Method (2 Minutes)

### Backend Environment Variables

1. **Open this file:**
   ```bash
   cat backend/.env.production
   ```

2. **Go to:** https://vercel.com/anasabounouars-projects/backend/settings/environment-variables

3. **Click "Add New"** and add each variable one by one:

   **Variable 1:**
   - Name: `MONGODB_URI`
   - Value: `mongodb+srv://anasabounouar:anas.200377@cluster.egdexnj.mongodb.net/bookmarketplace?retryWrites=true&w=majority&appName=Cluster`
   - Environment: Check ✅ Production

   **Variable 2:**
   - Name: `JWT_SECRET`
   - Value: `book-marketplace-super-secret-jwt-key-2025-min-32-characters-random-string-please`
   - Environment: Check ✅ Production

   **Variable 3:**
   - Name: `JWT_EXPIRE`
   - Value: `7d`
   - Environment: Check ✅ Production

   **Variable 4:**
   - Name: `NODE_ENV`
   - Value: `production`
   - Environment: Check ✅ Production

   **Variable 5:**
   - Name: `FRONTEND_URL`
   - Value: `https://frontend-klqmpwtzz-anasabounouars-projects.vercel.app`
   - Environment: Check ✅ Production

4. **Click "Save"** for each variable

---

### Frontend Environment Variables

1. **Open this file:**
   ```bash
   cat frontend/.env.production
   ```

2. **Go to:** https://vercel.com/anasabounouars-projects/frontend/settings/environment-variables

3. **Click "Add New"**:

   **Variable 1:**
   - Name: `VITE_API_URL`
   - Value: `https://backend-ejzf4qvbo-anasabounouars-projects.vercel.app/api`
   - Environment: Check ✅ Production

4. **Click "Save"**

---

## Option 3: Use Vercel CLI to Add Variables (Fastest!)

### Backend:
```bash
# Set backend environment variables
vercel env add MONGODB_URI production --cwd backend
# When prompted, paste: mongodb+srv://anasabounouar:anas.200377@cluster.egdexnj.mongodb.net/bookmarketplace?retryWrites=true&w=majority&appName=Cluster

vercel env add JWT_SECRET production --cwd backend
# When prompted, paste: book-marketplace-super-secret-jwt-key-2025-min-32-characters-random-string-please

vercel env add JWT_EXPIRE production --cwd backend
# When prompted, paste: 7d

vercel env add NODE_ENV production --cwd backend
# When prompted, paste: production

vercel env add FRONTEND_URL production --cwd backend
# When prompted, paste: https://frontend-klqmpwtzz-anasabounouars-projects.vercel.app
```

### Frontend:
```bash
# Set frontend environment variable
vercel env add VITE_API_URL production --cwd frontend
# When prompted, paste: https://backend-ejzf4qvbo-anasabounouars-projects.vercel.app/api
```

---

## After Adding Variables: REDEPLOY!

### Redeploy Backend:
```bash
vercel --cwd backend --prod
```

### Redeploy Frontend:
```bash
vercel --cwd frontend --prod
```

---

## MongoDB Atlas Configuration

**Don't forget this critical step!**

1. Go to: https://cloud.mongodb.com
2. Click your cluster
3. **Network Access** (left sidebar)
4. **Add IP Address**
5. **Allow Access from Anywhere**
6. Enter: `0.0.0.0/0`
7. **Confirm**

---

## Test Your Deployment

**Backend Health Check:**
```bash
curl https://backend-ejzf4qvbo-anasabounouars-projects.vercel.app/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Book Marketplace API is running!",
  "environment": "production",
  "mongodb": "connected"
}
```

**Frontend:**
Open: https://frontend-klqmpwtzz-anasabounouars-projects.vercel.app

Try to register and login!

---

## Quick Commands Summary

```bash
# Option A: Use CLI to add all variables (copy-paste one by one when prompted)
vercel env add MONGODB_URI production --cwd backend
vercel env add JWT_SECRET production --cwd backend
vercel env add JWT_EXPIRE production --cwd backend
vercel env add NODE_ENV production --cwd backend
vercel env add FRONTEND_URL production --cwd backend
vercel env add VITE_API_URL production --cwd frontend

# Then redeploy both
vercel --cwd backend --prod
vercel --cwd frontend --prod

# Option B: Just use the web dashboard (easier)
# 1. Go to the URLs above
# 2. Copy values from .env.production files
# 3. Paste them in
# 4. Redeploy using dashboard
```

---

**Choose whichever method you prefer! All will work perfectly! 🚀**
