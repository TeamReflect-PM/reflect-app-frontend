# Google Cloud Authentication Setup Guide

This guide explains how to set up authentication and Google Sign-In for your journal app using Google Cloud Platform.

## Project Information
- **Google Cloud Project ID**: `reflect-466215`
- **Project Email**: `teamreflect.dev@gmail.com`

## Prerequisites
- Google Cloud Platform account
- Firebase project
- React Native development environment

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project `reflect-466215`
3. Enter project name: `journal-app-modern-latest1`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication
1. In Firebase Console, navigate to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Click "Enable" toggle
   - **Google**: Click "Enable" toggle and configure

## Step 2: Google Sign-In Configuration

### 2.1 Configure Google Provider
1. In Firebase Authentication > Sign-in method > Google:
   - Click "Enable"
   - Set project support email: `teamreflect.dev@gmail.com`
   - Save configuration
   - Note down the **Web client ID** (you'll need this later)

### 2.2 Download Configuration Files

#### For Android:
1. Go to **Project Settings** > **General** tab
2. Scroll to "Your apps" section
3. Click "Add app" > Android icon
4. Enter Android package name: `com.journalappmodernlatest1`
5. Download `google-services.json`
6. Place file in `android/app/` directory

#### For iOS:
1. In Project Settings > General tab
2. Click "Add app" > iOS icon  
3. Enter iOS bundle ID: `com.journalappmodernlatest1`
4. Download `GoogleService-Info.plist`
5. Place file in `ios/` directory

#### For Web:
1. Click "Add app" > Web icon
2. Enter app name: `journal-app-modern-latest1`
3. Copy the Firebase config object
4. Update `src/database/firebase.js` with your config

## Step 3: Google Cloud Console Setup

### 3.1 OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project `reflect-466215`
3. Navigate to **APIs & Services** > **Credentials**
4. Click "Create credentials" > "OAuth 2.0 Client IDs"

### 3.2 Configure OAuth Client IDs

#### Web Application:
- **Type**: Web application
- **Name**: `journal-app-web-client`
- **Authorized JavaScript origins**: 
  - `http://localhost:19006` (for Expo web)
  - Your production domain
- **Authorized redirect URIs**:
  - `http://localhost:19006`
  - Your production domain

#### Android Application:
- **Type**: Android
- **Name**: `journal-app-android-client`
- **Package name**: `com.journalappmodernlatest1`
- **SHA-1 certificate fingerprint**: (Get from Android development setup)

#### iOS Application:
- **Type**: iOS
- **Name**: `journal-app-ios-client`
- **Bundle ID**: `com.journalappmodernlatest1`

## Step 4: Configure Application

### 4.1 Update Firebase Configuration
Edit `src/database/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "reflect-466215.firebaseapp.com",
  projectId: "reflect-466215",
  storageBucket: "reflect-466215.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID_HERE",
  appId: "YOUR_APP_ID_HERE",
  measurementId: "YOUR_MEASUREMENT_ID_HERE" // Optional
};
```

### 4.2 Update Google Sign-In Configuration
Edit `src/config/googleSignIn.js`:

```javascript
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID_HERE', // From OAuth 2.0 Client IDs
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});
```

## Step 5: Enable Required APIs

In Google Cloud Console, enable the following APIs:
1. **Firebase Authentication API**
2. **Google Sign-In API**
3. **Cloud Firestore API** (for database)
4. **Firebase Hosting API** (for web deployment)

## Step 6: Security Rules

### 6.1 Firestore Security Rules
Configure Firestore rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/journal/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to create their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6.2 Authentication Security
- Enable email verification for new accounts
- Set password requirements (minimum 6 characters)
- Configure authorized domains in Firebase Authentication settings

## Step 7: Testing Setup

### 7.1 Test Environment
1. **Development**: `http://localhost:19006`
2. **Staging**: Your staging domain
3. **Production**: Your production domain

### 7.2 Test Accounts
Create test accounts for:
- Email/password authentication
- Google Sign-In authentication

## Step 8: Deployment Configuration

### 8.1 Environment Variables
Set the following environment variables for production:

```bash
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=reflect-466215.firebaseapp.com
FIREBASE_PROJECT_ID=reflect-466215
GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
```

### 8.2 Production Domains
Update OAuth 2.0 client configuration with:
- Production web domain
- App store bundle IDs
- Play store package names

## Troubleshooting

### Common Issues:

1. **Google Sign-In not working on mobile**:
   - Verify SHA-1 certificate fingerprint
   - Check package name/bundle ID
   - Ensure google-services.json/GoogleService-Info.plist are properly configured

2. **Web authentication fails**:
   - Verify authorized JavaScript origins
   - Check redirect URIs
   - Ensure web client ID is correctly configured

3. **Email verification not sending**:
   - Check Firebase project settings
   - Verify sender email configuration
   - Check spam folders during testing

4. **Firestore permission denied**:
   - Verify security rules
   - Ensure user is properly authenticated
   - Check user ID matches in rules

### Debug Steps:
1. Check browser/device console for errors
2. Verify Firebase configuration
3. Test with Firebase Authentication emulator
4. Check Google Cloud Console audit logs

## Security Best Practices

1. **Never commit sensitive credentials** to version control
2. **Use environment variables** for API keys
3. **Implement proper Firestore security rules**
4. **Enable email verification** for new accounts
5. **Monitor authentication logs** in Firebase Console
6. **Regularly review OAuth client configurations**
7. **Use HTTPS** in production
8. **Implement proper error handling** for authentication flows

## Support

For additional support:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Google Cloud Authentication](https://cloud.google.com/docs/authentication)
- [React Native Firebase](https://rnfirebase.io/)

## Project Contact
- Email: teamreflect.dev@gmail.com
- Project ID: reflect-466215