
# Mobile Build Instructions for VeriVault

## Prerequisites

1. **Node.js and npm** installed
2. **Android Studio** installed (for Android builds)
3. **Xcode** installed (for iOS builds - macOS only)
4. **Git** installed

## Initial Setup

1. **Clone the project from GitHub** (after exporting via "Export to GitHub" button)
   ```bash
   git clone <your-github-repo-url>
   cd <project-name>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add mobile platforms**
   ```bash
   # For Android
   npx cap add android
   
   # For iOS (macOS only)
   npx cap add ios
   ```

## Building for Android

1. **Build the web assets**
   ```bash
   npm run build
   ```

2. **Sync with native platform**
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio** (recommended for first build)
   ```bash
   npx cap open android
   ```
   
   Or build directly:
   ```bash
   npx cap run android
   ```

4. **Required Android Configuration**
   - Ensure Android SDK 33+ is installed
   - Set minimum SDK version to 24 in `android/app/build.gradle`
   - The biometric permissions are already configured in AndroidManifest.xml

## Building for iOS

1. **Build the web assets**
   ```bash
   npm run build
   ```

2. **Sync with native platform**
   ```bash
   npx cap sync ios
   ```

3. **Open in Xcode** (required for iOS)
   ```bash
   npx cap open ios
   ```

4. **Required iOS Configuration**
   - Set deployment target to iOS 13.0+
   - Add Face ID usage description in Info.plist:
     ```xml
     <key>NSFaceIDUsageDescription</key>
     <string>Use Face ID to authenticate with VeriVault</string>
     ```

## Testing Biometric Features

### Android
- Use a physical device with fingerprint sensor or face unlock
- Android emulator with API 28+ can simulate fingerprint (limited)

### iOS
- Use a physical device with Touch ID or Face ID
- iOS Simulator can simulate biometric authentication

## Current Biometric Implementation

The current implementation uses a development-friendly biometric service that:
- Detects native platform capabilities using Capacitor core
- Uses localStorage for credential storage in development/testing
- Provides mock biometric verification for testing
- Logs biometric operations to console for debugging
- Will work as a foundation for integrating actual native biometric APIs

**Note:** This implementation provides a complete foundation that can be enhanced with actual native biometric plugins when needed for production deployment.

## Production Enhancement

For production deployment with real biometric authentication, consider integrating:
- Native Android BiometricPrompt API
- iOS LocalAuthentication framework
- Third-party Capacitor biometric plugins (when available)

## Production Build

1. **Generate signed APK (Android)**
   - In Android Studio: Build > Generate Signed Bundle/APK
   - Or configure signing in `android/app/build.gradle`

2. **App Store build (iOS)**
   - In Xcode: Product > Archive
   - Use Xcode's organizer for App Store submission

## Troubleshooting

### Common Issues

1. **Biometric not working**
   - Check console logs for mock biometric operations
   - Ensure device has biometric hardware enrolled (for real devices)
   - Verify AndroidManifest.xml includes biometric permissions

2. **Build failures**
   - Clean build folders: `npx cap clean android` or `npx cap clean ios`
   - Rebuild: `npm run build && npx cap sync`

3. **Network issues**
   - Ensure Supabase URL is accessible from mobile device
   - Check CORS settings in Supabase project

### Logs and Debugging

- **Android**: Use `adb logcat` or Android Studio logcat
- **iOS**: Use Xcode console or Safari Web Inspector
- **Web debugging**: Enable USB debugging for mobile Chrome DevTools
- **Biometric logs**: Check browser/device console for mock biometric operations

## Hot Reload Development

For development with hot reload:
1. Ensure the server.url in capacitor.config.ts points to your development server
2. Run `npx cap run android --livereload` or `npx cap run ios --livereload`

## Next Steps After Building

1. Test all biometric flows on physical devices
2. Test network connectivity and offline behavior
3. Verify authentication persistence across app restarts
4. Test app performance and battery usage
5. Prepare for app store submission if needed
6. Consider integrating with production-ready native biometric APIs
