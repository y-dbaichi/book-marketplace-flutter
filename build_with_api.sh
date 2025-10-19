#!/bin/bash
# Build script that loads API key from .env file

# Load .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your OPENROUTE_API_KEY"
    exit 1
fi

# Check if API key is set
if [ -z "$OPENROUTE_API_KEY" ] || [ "$OPENROUTE_API_KEY" = "YOUR_API_KEY_HERE" ]; then
    echo "❌ Error: OPENROUTE_API_KEY not configured in .env file"
    echo "Please edit .env and add your OpenRouteService API key"
    exit 1
fi

echo "✅ Building with OpenRouteService API key..."

# Build APK with API key
flutter build apk --release \
  --dart-define=OPENROUTE_API_KEY=$OPENROUTE_API_KEY

echo "✅ Build complete!"
echo "📦 APK location: build/app/outputs/flutter-apk/app-release.apk"
