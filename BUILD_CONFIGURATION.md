# Build Configuration Guide

## 🔐 Environment Variables

This app uses environment variables for sensitive configuration. **Never** commit API keys to source control.

### Required Environment Variables

#### 1. OpenRouteService API Key
**Purpose:** Enables turn-by-turn navigation and route optimization
**Free Tier:** 2,000 requests/day
**Get Your Key:** https://openrouteservice.org/dev/#/signup

### Building the App

#### Development Build (with API key)
```bash
flutter run --dart-define=OPENROUTE_API_KEY=your_actual_api_key_here
```

#### Production Release Build
```bash
flutter build apk --release \
  --dart-define=OPENROUTE_API_KEY=your_actual_api_key_here \
  --no-tree-shake-icons
```

#### Testing Without API (Mock Mode)
```bash
flutter run --dart-define=USE_MOCK_ROUTING=true
```

This uses fallback routing calculations instead of calling the real API.

### CI/CD Integration

#### GitHub Actions Example
```yaml
- name: Build APK
  run: flutter build apk --release --dart-define=OPENROUTE_API_KEY=${{ secrets.OPENROUTE_API_KEY }}
  env:
    OPENROUTE_API_KEY: ${{ secrets.OPENROUTE_API_KEY }}
```

#### Local .env File (for convenience)

Create a file named `build.sh` in the project root:

```bash
#!/bin/bash
# DO NOT commit this file with real keys!
# Add to .gitignore

export OPENROUTE_API_KEY="your_actual_api_key_here"

flutter build apk --release \
  --dart-define=OPENROUTE_API_KEY=$OPENROUTE_API_KEY \
  --no-tree-shake-icons

echo "✅ Build complete: build/app/outputs/flutter-apk/app-release.apk"
```

Make it executable:
```bash
chmod +x build.sh
```

Then build with:
```bash
./build.sh
```

### Adding to .gitignore

Ensure your `.gitignore` includes:
```gitignore
# Environment-specific configuration
build.sh
.env
.env.local
*.key
```

### Troubleshooting

**Problem:** "PLEASE_SET_API_KEY_VIA_DART_DEFINE" error
**Solution:** You forgot to pass the API key during build. Use `--dart-define` flag.

**Problem:** Routes not calculating
**Solution:** Check your API key is valid at OpenRouteService dashboard.

**Problem:** Want to test without real API
**Solution:** Build with `--dart-define=USE_MOCK_ROUTING=true`

## Security Best Practices ✅

1. ✅ API keys loaded from environment variables (not hardcoded)
2. ✅ Keys never committed to version control
3. ✅ Separate mock mode for testing
4. ✅ Clear documentation for team members
5. ✅ CI/CD ready with secrets management

---

**Last Updated:** January 2025
**Project:** Book Marketplace Flutter App
**Developer:** Yassine Dbaichi
