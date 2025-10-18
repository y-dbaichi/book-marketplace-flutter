#!/bin/bash

# Start Backend Server Script
echo "🚀 Starting Backend Server..."

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Kill any existing process on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Start the server
node server.js
