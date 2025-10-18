#!/bin/bash

# Flutter Web Runner Script
# This script runs the Flutter app in Chrome on port 8080

echo "🚀 Starting Flutter Web App on Chrome (port 8080)..."
echo ""

# Check if Flutter is installed
if ! command -v flutter &> /dev/null
then
    echo "❌ Flutter is not installed or not in PATH"
    echo "Please install Flutter from https://flutter.dev/docs/get-started/install"
    exit 1
fi

# Navigate to the project directory (script location)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📂 Project directory: $SCRIPT_DIR"
echo ""

# Kill any existing Flutter processes on port 8080
echo "🧹 Cleaning up any existing Flutter processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Run Flutter web on Chrome with port 8080
echo "▶️  Running Flutter app..."
echo "🌐 Opening Chrome at http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

flutter run -d chrome --web-port=8080 --web-hostname=localhost
