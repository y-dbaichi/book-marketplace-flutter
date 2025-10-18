#!/bin/bash

# Book Marketplace - Vercel Deployment Script
# This script helps deploy backend and frontend to Vercel

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📦 Book Marketplace - Vercel Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found"
    echo "📥 Installing Vercel CLI globally..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
fi

echo "Please select what to deploy:"
echo ""
echo "1) Backend API only"
echo "2) Frontend only"
echo "3) Both (Backend + Frontend)"
echo "4) Exit"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying Backend API..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cd backend
        vercel --prod
        cd ..
        echo ""
        echo "✅ Backend deployment complete!"
        echo "⚠️  Don't forget to set environment variables in Vercel Dashboard:"
        echo "   - MONGODB_URI"
        echo "   - JWT_SECRET"
        echo "   - JWT_EXPIRE"
        echo "   - NODE_ENV=production"
        echo "   - FRONTEND_URL (after frontend deployment)"
        ;;
    2)
        echo ""
        echo "🎨 Deploying Frontend..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cd frontend
        vercel --prod
        cd ..
        echo ""
        echo "✅ Frontend deployment complete!"
        echo "⚠️  Don't forget to set environment variables in Vercel Dashboard:"
        echo "   - VITE_API_URL (your backend API URL + /api)"
        ;;
    3)
        echo ""
        echo "🚀 Deploying Backend API..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cd backend
        vercel --prod
        BACKEND_URL=$(vercel ls --prod 2>/dev/null | grep -o 'https://[^ ]*' | head -1)
        cd ..

        echo ""
        echo "✅ Backend deployed!"

        echo ""
        echo "🎨 Deploying Frontend..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        cd frontend
        vercel --prod
        FRONTEND_URL=$(vercel ls --prod 2>/dev/null | grep -o 'https://[^ ]*' | head -1)
        cd ..

        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "✅ Both deployments complete!"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "📝 IMPORTANT - Set these environment variables:"
        echo ""
        echo "Backend Project:"
        if [ -n "$FRONTEND_URL" ]; then
            echo "  - FRONTEND_URL=$FRONTEND_URL"
        else
            echo "  - FRONTEND_URL=<your-frontend-url>"
        fi
        echo "  - MONGODB_URI=<your-mongodb-uri>"
        echo "  - JWT_SECRET=<strong-random-secret>"
        echo "  - JWT_EXPIRE=7d"
        echo "  - NODE_ENV=production"
        echo ""
        echo "Frontend Project:"
        if [ -n "$BACKEND_URL" ]; then
            echo "  - VITE_API_URL=${BACKEND_URL}/api"
        else
            echo "  - VITE_API_URL=<your-backend-url>/api"
        fi
        echo ""
        echo "Then REDEPLOY both projects to apply the changes!"
        ;;
    4)
        echo "👋 Deployment cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Go to Vercel Dashboard (vercel.com)"
echo "2. Configure environment variables for your projects"
echo "3. Redeploy to apply environment variables"
echo "4. Test your deployed applications"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
