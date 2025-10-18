# 📱 Flutter Mobile App Deployment Guide

**Last Updated:** 2025-10-18

---

## ✅ Configuration Complete!

Your Flutter app is now configured to use the **production backend**:

```dart
static const String baseUrl = 'https://book-marketplace-api.vercel.app/api';
```

---

## 📋 Understanding Flutter Deployment

Unlike web apps (React), Flutter mobile apps **cannot be deployed to Vercel**. Instead, you have several options:

### Option 1: Direct APK Distribution (Easiest for Testing)
Build an APK file and share it directly with users to install on Android devices.

### Option 2: Google Play Store (Production)
Publish your app to Google Play Store for public distribution.

### Option 3: Apple App Store (iOS)
Build and publish to Apple App Store for iOS users.

### Option 4: Internal Testing (TestFlight/Firebase)
Use testing platforms for beta distribution.

---

## 🚀 Option 1: Build APK for Android (Recommended for Testing)

### Prerequisites
- Android Studio installed
- Android SDK configured
- Flutter installed

### Step 1: Accept Android SDK Licenses

```bash
flutter doctor --android-licenses
```

Press `y` to accept all licenses when prompted.

### Step 2: Build Release APK

```bash
# Clean previous builds
flutter clean

# Build the APK
flutter build apk --release
```

This creates an APK at:
```
build/app/outputs/flutter-apk/app-release.apk
```

### Step 3: Share the APK

**Methods to distribute:**

1. **Email/Message:** Send the APK file directly
2. **Google Drive:** Upload and share the link
3. **Cloud Storage:** Use Dropbox, OneDrive, etc.
4. **QR Code:** Use tools like `goqr.me` to create a download QR code

### Step 4: Install on Android Device

On the receiving device:
1. Download the APK file
2. Open the file
3. Allow "Install from Unknown Sources" if prompted
4. Install and open the app

---

## 📦 Option 2: Publish to Google Play Store

### Prerequisites
- Google Play Developer Account ($25 one-time fee)
- Signed APK or App Bundle

### Step 1: Create a Keystore

```bash
# Generate signing key
keytool -genkey -v -keystore ~/book-marketplace-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias book-marketplace
```

**Save these details securely:**
- Keystore password
- Key alias
- Key password

### Step 2: Configure Signing

Create `android/key.properties`:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=book-marketplace
storeFile=/Users/YOUR_USERNAME/book-marketplace-release.jks
```

Update `android/app/build.gradle`:

```gradle
// Add before android {}
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config

    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Step 3: Build App Bundle

```bash
flutter build appbundle --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

### Step 4: Upload to Play Console

1. Go to https://play.google.com/console
2. Create new app
3. Fill in app details (name, description, screenshots)
4. Upload the `.aab` file
5. Set up pricing & distribution
6. Submit for review

**Review Time:** Usually 1-7 days

---

## 🍎 Option 3: Build for iOS (Requires Mac)

### Prerequisites
- Mac computer (required for iOS builds)
- Xcode installed
- Apple Developer Account ($99/year)

### Step 1: Configure Xcode

```bash
# Open iOS project in Xcode
open ios/Runner.xcworkspace
```

In Xcode:
1. Select "Runner" project
2. Go to "Signing & Capabilities"
3. Select your Apple Developer Team
4. Set a unique Bundle Identifier (e.g., `com.yourname.bookmarketplace`)

### Step 2: Build for iOS

```bash
flutter build ios --release
```

### Step 3: Archive and Upload

1. Open Xcode
2. Product → Archive
3. Distribute App → App Store Connect
4. Follow upload wizard
5. Submit for review in App Store Connect

---

## 🧪 Option 4: Testing Platforms

### Firebase App Distribution (Free)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Build and upload
flutter build apk --release
firebase appdistribution:distribute build/app/outputs/flutter-apk/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups "testers"
```

### TestFlight (iOS only)

1. Upload build through Xcode or App Store Connect
2. Add testers via email
3. Testers install TestFlight app
4. They receive invitation to test your app

---

## 🛠️ Quick Build Commands

### Development Build (for testing)
```bash
# Android
flutter run --debug

# iOS
flutter run --debug -d "iPhone Simulator"
```

### Release Build (optimized, smaller size)
```bash
# Android APK
flutter build apk --release

# Android App Bundle (for Play Store)
flutter build appbundle --release

# iOS
flutter build ios --release
```

### Split APKs (smaller downloads)
```bash
flutter build apk --split-per-abi --release
```

This creates separate APKs for:
- `app-armeabi-v7a-release.apk` (32-bit ARM)
- `app-arm64-v8a-release.apk` (64-bit ARM)
- `app-x86_64-release.apk` (64-bit Intel)

---

## 📊 App Store Listing Requirements

### Screenshots Needed
- **Android:** 2-8 screenshots (min 320px on shortest side)
- **iOS:** Screenshots for each device size

### App Information
- **Name:** Book Marketplace (or your choice)
- **Short Description:** 80 characters
- **Full Description:** Up to 4000 characters
- **Category:** Shopping or Books
- **Content Rating:** Select appropriate rating
- **Privacy Policy URL:** Required for both stores

### Assets Needed
- **App Icon:** 512x512 PNG (Google Play), 1024x1024 PNG (App Store)
- **Feature Graphic:** 1024x500 PNG (Google Play)
- **Screenshots:** At least 2 screenshots showing key features

---

## 🎯 Current Configuration

Your Flutter app is configured with:

### Production API
```dart
baseUrl = 'https://book-marketplace-api.vercel.app/api'
```

### Features
- ✅ Seller dashboard
- ✅ Order management
- ✅ Map integration for delivery routes
- ✅ Seller notes on orders
- ✅ Real-time order updates
- ✅ Secure authentication

### Test Accounts
- **Seller:** seller1@gmail.com / aaaaaa
- **Buyer:** buyer1@gmail.com / aaaaaa

---

## 🚨 Important Notes

### Before Building for Production

1. **Update App Name**
   - Android: `android/app/src/main/AndroidManifest.xml`
   - iOS: `ios/Runner/Info.plist`

2. **Update Package Name/Bundle ID**
   - Android: `android/app/build.gradle` (applicationId)
   - iOS: Xcode project settings

3. **App Icon**
   - Use flutter_launcher_icons package
   - Place icons in `assets/icon/`

4. **Disable Debug Features**
   - Already done: `enableApiLogging = false`

5. **Test Thoroughly**
   - Test on real devices
   - Test all user flows
   - Test with production API

### Security Checklist

- ✅ API logging disabled in production
- ✅ Using HTTPS for API calls
- ✅ Credentials stored securely (flutter_secure_storage)
- ✅ JWT tokens handled properly
- ⚠️ Create keystore and keep it secure (for signing)
- ⚠️ Never commit keystore or key.properties to git

---

## 📝 Next Steps (Choose One)

### For Quick Testing (Easiest)
1. Run: `flutter doctor --android-licenses` (accept all)
2. Run: `flutter build apk --release`
3. Share the APK file with testers
4. Install on Android devices

### For Google Play Store
1. Create Google Play Developer account
2. Generate signing keystore
3. Build app bundle
4. Upload to Play Console
5. Wait for review approval

### For Apple App Store
1. Get Apple Developer account
2. Configure Xcode signing
3. Build iOS release
4. Upload to App Store Connect
5. Submit for review

---

## 🆘 Troubleshooting

### "License not accepted" error
```bash
flutter doctor --android-licenses
```

### "SDK not found" error
Install Android Studio and configure SDK path

### iOS build fails
Make sure Xcode is installed and you have a Mac

### App crashes on startup
Check API connectivity and test credentials

---

## 📚 Additional Resources

- **Flutter Deployment Docs:** https://docs.flutter.dev/deployment
- **Google Play Console:** https://play.google.com/console
- **App Store Connect:** https://appstoreconnect.apple.com
- **Firebase App Distribution:** https://firebase.google.com/docs/app-distribution

---

**Your app is ready to build and deploy!** Choose the deployment method that fits your needs best. For quick testing, start with building an APK.
