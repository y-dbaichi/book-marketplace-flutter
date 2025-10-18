#!/bin/bash

# Import Environment Variables to Vercel
# This script will add all environment variables automatically

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔑 Importing Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backend Environment Variables
echo "📦 Adding Backend Environment Variables..."
echo ""

echo "Adding MONGODB_URI..."
echo "mongodb+srv://anasabounouar:anas.200377@cluster.egdexnj.mongodb.net/bookmarketplace?retryWrites=true&w=majority&appName=Cluster" | \
vercel env add MONGODB_URI production --cwd backend --yes

echo "Adding JWT_SECRET..."
echo "book-marketplace-super-secret-jwt-key-2025-min-32-characters-random-string-please" | \
vercel env add JWT_SECRET production --cwd backend --yes

echo "Adding JWT_EXPIRE..."
echo "7d" | vercel env add JWT_EXPIRE production --cwd backend --yes

echo "Adding NODE_ENV..."
echo "production" | vercel env add NODE_ENV production --cwd backend --yes

echo "Adding FRONTEND_URL..."
echo "https://frontend-klqmpwtzz-anasabounouars-projects.vercel.app" | \
vercel env add FRONTEND_URL production --cwd backend --yes

echo ""
echo "✅ Backend environment variables added!"
echo ""

# Frontend Environment Variable
echo "🎨 Adding Frontend Environment Variable..."
echo ""

echo "Adding VITE_API_URL..."
echo "https://backend-ejzf4qvbo-anasabounouars-projects.vercel.app/api" | \
vercel env add VITE_API_URL production --cwd frontend --yes

echo ""
echo "✅ Frontend environment variable added!"
echo ""

# Redeploy
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔄 Redeploying Projects"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🚀 Redeploying Backend..."
vercel --cwd backend --prod --yes

echo ""
echo "🎨 Redeploying Frontend..."
vercel --cwd frontend --prod --yes

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Your Live Apps:"
echo ""
echo "Backend:  https://backend-ejzf4qvbo-anasabounouars-projects.vercel.app"
echo "Frontend: https://frontend-klqmpwtzz-anasabounouars-projects.vercel.app"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ⚠️  ONE MORE STEP: MongoDB Atlas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Go to: https://cloud.mongodb.com"
echo "1. Network Access → Add IP Address"
echo "2. Allow Access from Anywhere: 0.0.0.0/0"
echo "3. Confirm"
echo ""
echo "Then test your backend:"
echo "curl https://backend-ejzf4qvbo-anasabounouars-projects.vercel.app/api/health"
echo ""
echo "🎉 You're done! Enjoy your deployed app!"
echo ""
