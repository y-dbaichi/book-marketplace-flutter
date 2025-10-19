# 🚀 Vercel Auto-Deploy Setup Guide

This guide will help you set up automatic deployments triggered by git push.

---

## ⚡ Quick Setup (Recommended)

### Step 1: Push Your Code to GitHub

```bash
# Push all commits to your branch
git push origin anas_on_board_2

# Or push to main branch
git push origin main
```

### Step 2: Connect GitHub to Vercel

**Option A: Via Vercel Dashboard (Easiest)**

1. Go to https://vercel.com/dashboard
2. Click on your project: "book-marketplace-flutter"
3. Go to **Settings** → **Git**
4. Click **Connect Git Repository**
5. Select **GitHub** and authorize Vercel
6. Choose repository: `y-dbaichi/book-marketplace-flutter`
7. Select branch: `main` (or `anas_on_board_2`)
8. Click **Connect**

**Option B: Via Vercel CLI**

```bash
# This command will try to connect your GitHub repo
vercel git connect
```

### Step 3: Configure Auto-Deploy Settings

In Vercel Dashboard → Settings → Git:

**Production Branch:**
- Set to: `main` (or your production branch)
- ✅ Enable "Automatic Deployments"

**Preview Branches:**
- Set to: `anas_on_board_2` (or any other branches)
- ✅ Enable "Automatic Deployments for Preview"

**Root Directory:**
- Keep as: `./` (since we have vercel.json at root)

**Build & Development Settings:**
- Framework Preset: **Other**
- Build Command: Leave empty (handled by vercel.json)
- Output Directory: Leave empty
- Install Command: `cd backend && npm install`

---

## 🔧 vercel.json Configuration

Your current `vercel.json` is already configured:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Note:** This deploys only the `backend/` directory thanks to `.vercelignore`

---

## 📋 What Happens After Setup

Once connected, **every git push** will:

1. ✅ **Trigger automatic build** on Vercel
2. ✅ **Deploy to preview URL** (for non-production branches)
3. ✅ **Deploy to production URL** (for main/production branch)
4. ✅ **Send deployment notifications** (email/Slack if configured)

**Example Workflow:**

```bash
# Make changes to your code
git add .
git commit -m "Update API endpoint"
git push origin main

# Vercel automatically:
# - Detects the push
# - Builds your backend
# - Deploys to production
# - Sends you a notification
```

---

## 🌐 Deployment URLs

### Production Deployment
**Branch:** `main`
**URL:** https://book-marketplace-flutter.vercel.app
*or your custom domain*

### Preview Deployments
**Branch:** Any other branch (e.g., `anas_on_board_2`)
**URL:** `https://book-marketplace-flutter-{branch}-{user}.vercel.app`

**Example:**
```
Branch: feature/new-endpoint
Preview URL: https://book-marketplace-flutter-git-feature-new-endpoint-anasabounouar.vercel.app
```

---

## 🔐 Environment Variables

To set environment variables for automatic deployments:

### Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `MONGODB_URI` (Production value)
   - `JWT_SECRET` (Production value)
   - Any other secrets

5. Choose scope:
   - ✅ **Production** (for main branch)
   - ✅ **Preview** (for preview branches)
   - ✅ **Development** (for local development)

### Via Vercel CLI

```bash
# Add environment variable
vercel env add MONGODB_URI production

# Add to all environments
vercel env add JWT_SECRET production preview development

# List all environment variables
vercel env ls
```

---

## 📊 Monitoring Deployments

### Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click on your project
3. See all deployments with:
   - Status (Building/Ready/Error)
   - Branch name
   - Commit message
   - Build logs
   - Preview URL

### Via Vercel CLI

```bash
# List recent deployments
vercel ls

# Get deployment logs
vercel logs [deployment-url]

# Inspect specific deployment
vercel inspect [deployment-url]
```

---

## 🚨 Troubleshooting

### Issue: Deployment Failed

**Check build logs:**
```bash
vercel logs [deployment-url] --follow
```

**Common fixes:**
- Check `vercel.json` syntax
- Verify environment variables are set
- Check Node.js version compatibility
- Review `.vercelignore` (make sure backend isn't ignored)

### Issue: Wrong Directory Deployed

**Fix:** Update `vercel.json` to specify correct source:

```json
{
  "builds": [
    {
      "src": "backend/api/index.js",  // ← Correct path
      "use": "@vercel/node"
    }
  ]
}
```

### Issue: Environment Variables Not Working

**Fix:** Make sure they're added in Vercel Dashboard:
1. Settings → Environment Variables
2. Select correct scope (Production/Preview/Development)
3. Redeploy after adding variables

---

## ✅ Verification Steps

After setup, verify automatic deployments work:

```bash
# 1. Make a small change
echo "# Test" >> README.md

# 2. Commit and push
git add README.md
git commit -m "test: Verify auto-deploy"
git push origin main

# 3. Check Vercel Dashboard
# - New deployment should appear automatically
# - Status should change: Queued → Building → Ready

# 4. Visit deployment URL
# - Changes should be live
```

---

## 🎯 Best Practices

### Branch Strategy

**Production Branch:** `main`
- Auto-deploys to production URL
- Requires code review before merge
- Stable, tested code only

**Development Branches:** `feature/*`, `dev`, etc.
- Auto-deploys to preview URLs
- Test features before merging
- Each branch gets unique preview URL

### Commit Messages

Use clear commit messages for easy deployment tracking:
```bash
git commit -m "feat: Add new route optimization algorithm"
git commit -m "fix: Resolve GPS accuracy issue"
git commit -m "docs: Update API documentation"
```

### Environment Management

**Never commit secrets!**
```bash
# ❌ Bad - secrets in code
const MONGO_URI = "mongodb://user:password@..."

# ✅ Good - use environment variables
const MONGO_URI = process.env.MONGODB_URI
```

---

## 📱 Integration with GitHub Actions (Optional)

For more control, you can add GitHub Actions:

Create `.github/workflows/vercel-deploy.yml`:

```yaml
name: Vercel Deploy

on:
  push:
    branches: [main, anas_on_board_2]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Note:** This requires setting up GitHub secrets. The Vercel dashboard integration is simpler and recommended.

---

## 🎉 You're Done!

Once connected, you can:

1. **Push code** → Automatic deployment ✅
2. **Create PR** → Preview deployment ✅
3. **Merge to main** → Production deployment ✅
4. **Rollback** → One-click in Vercel dashboard ✅

No more manual `vercel deploy` commands needed! 🚀

---

## 📞 Support

**Vercel Documentation:**
- https://vercel.com/docs/concepts/git
- https://vercel.com/docs/cli

**Get Help:**
```bash
vercel help
vercel help deploy
vercel help env
```

**Your Current Setup:**
- Project: book-marketplace-flutter
- Current URL: https://backend-avgpw610c-anasabounouars-projects.vercel.app
- GitHub Repo: y-dbaichi/book-marketplace-flutter

---

*Auto-deploy setup guide created by Claude Code*
