# Journal App Modern Latest1

A modern React Native journal application with authentication, Google Sign-In, and mental health features.

## Features

- **Authentication**
  - Email/Password Sign Up with email verification (OTP)
  - Email/Password Sign In
  - Google Sign-In integration
  - Auto-redirect after signup to signin page

- **Home Page**
  - Daily journal entry creation
  - View previous journal entries
  - Date-based organization
  - Same UI and features as journal-app-modern

- **Navigation**
  - Home (Journal entries)
  - My Profile (Coming Soon)
  - Mood Tracker (Coming Soon)
  - AI Chatbot (Coming Soon)
  - Check-ins (Coming Soon)
  - Notifications (Coming Soon)

## Technology Stack

- **React Native** with Expo
- **Firebase Authentication** for user management
- **Cloud Firestore** for data storage
- **Google Sign-In** for OAuth authentication
- **React Navigation** for app navigation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Firebase project setup
- Google Cloud Platform account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd journal-app-modern-latest1
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Follow the setup guide in `GOOGLE_CLOUD_AUTH_SETUP.md`
   - Update `src/database/firebase.js` with your Firebase config
   - Update `src/config/googleSignIn.js` with your Google client ID

4. Start the development server:
```bash
npm start
```

## Project Structure

```
journal-app-modern-latest1/
├── App.js                 # Main app component with navigation
├── src/
│   ├── components/        # Reusable UI components
│   ├── config/           # Configuration files
│   │   └── googleSignIn.js
│   ├── database/         # Database configuration
│   │   └── firebase.js
│   ├── pages/            # Screen components
│   │   ├── SignInPage.js
│   │   ├── SignUpPage.js
│   │   ├── HomePage.js
│   │   ├── MoodTrackerPage.js
│   │   ├── ChatbotPage.js
│   │   ├── CheckinsPage.js
│   │   ├── NotificationsPage.js
│   │   └── ProfilePage.js
│   └── utils/            # Utility functions
│       └── palette.js    # Color theme
├── assets/               # Images and static assets
├── package.json
└── GOOGLE_CLOUD_AUTH_SETUP.md
```

## Firebase Configuration

The app uses the following Firebase services:
- **Authentication**: Email/Password and Google Sign-In
- **Firestore**: User data and journal entries storage

## Google Cloud Project

- **Project ID**: reflect-466215
- **Project Email**: teamreflect.dev@gmail.com

## Authentication Flow

1. **Landing Page**: Sign In (with Google Sign-In option)
2. **Sign Up Flow**: Email → Email Verification (OTP) → Password → Redirect to Sign In
3. **Post-Login**: Home page with journal features
4. **Navigation**: Access to all app sections via menu

## Security

- Email verification required for new accounts
- Firestore security rules restrict access to user's own data
- Environment variables for sensitive configuration
- No sensitive credentials in source code

## Development

### Running on Different Platforms

- **Web**: `npm run web`
- **iOS**: `npm run ios` (requires Xcode)
- **Android**: `npm run android` (requires Android Studio)

### Environment Setup

Create a `.env` file with your configuration:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=reflect-466215.firebaseapp.com
FIREBASE_PROJECT_ID=reflect-466215
GOOGLE_WEB_CLIENT_ID=your_web_client_id
```

## Contributing

1. Follow the existing code style and structure
2. Test authentication flows on all platforms
3. Ensure proper error handling
4. Update documentation for new features

## License

This project is private and confidential.

## Support

For setup issues or questions, refer to:
- `GOOGLE_CLOUD_AUTH_SETUP.md` for authentication setup
- Firebase Console for project management
- Google Cloud Console for OAuth configuration