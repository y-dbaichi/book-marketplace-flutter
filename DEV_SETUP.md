# 🚀 Development Setup Guide

## OpenRouteService API Key Configuration

Your API key is already configured! Here are all the ways to run the app:

---

## ✅ Method 1: VS Code Debug (Recommended for Development)

1. Open the project in VS Code
2. Go to **Run and Debug** (Ctrl+Shift+D / Cmd+Shift+D)
3. Select **"Flutter (Mobile/Emulator with API Key)"** from the dropdown
4. Press **F5** or click the green play button

✅ **API key is automatically loaded!** No extra steps needed.

---

## ✅ Method 2: Terminal Script (Quick Dev Run)

Run this command in the terminal:

```bash
./run_dev.sh
```

✅ **API key is automatically loaded from .env file!**

---

## ✅ Method 3: Manual Flutter Run

If you prefer running `flutter run` manually:

```bash
flutter run --dart-define=OPENROUTE_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjBmYmNiMTA0ZjlhODQ4YjZiNWVmNWJjM2FiODZmZTU0IiwiaCI6Im11cm11cjY0In0=
```

---

## ✅ Method 4: Build Release APK

To build a release APK with the API key:

```bash
./build_with_api.sh
```

✅ **APK will be created at:** `build/app/outputs/flutter-apk/app-release.apk`

---

## 🗺️ Testing the Route Feature

After running the app:

1. Login as a seller
2. Go to **"Mes Livraisons"**
3. Tap **"Planifier Tournée"** (if you have confirmed orders)
4. Set a starting point:
   - Tap **GPS icon** for current location, OR
   - Tap anywhere on the map
5. Tap **"Calculer"** button
6. ✅ You should see **curved blue routes** following actual roads!
7. ✅ Turn-by-turn directions appear at the bottom
8. Tap **"Naviguer"** to launch Google Maps or Waze

---

## 🔑 API Key Location

- **Stored in:** `.env` file (git-ignored for security)
- **Retrieved from:** Git history (commit ca9288d)
- **Already configured in:** VS Code launch.json

---

## ❓ Troubleshooting

### "Straight lines instead of curved routes"

❌ **Problem:** API key not loaded

✅ **Solution:** Use one of the methods above (don't just run `flutter run` without the API key)

### "Permission denied" when running scripts

```bash
chmod +x run_dev.sh
chmod +x build_with_api.sh
```

---

## 📝 Notes

- The `.env` file is **git-ignored** for security (API keys should never be committed)
- Your API key allows **2,000 free requests per day** with OpenRouteService
- The key is from your original implementation (found in git history)

---

**Happy coding!** 🎉
