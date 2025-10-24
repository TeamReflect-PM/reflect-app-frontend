import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator, Platform } from 'react-native';

// Import screens
import SignInPage from './src/pages/SignInPage';
import SignUpPage from './src/pages/SignUpPage';
import HomePage from './src/pages/HomePage';
import MoodTrackerPage from './src/pages/MoodTrackerPage';
import ChatbotPage from './src/pages/ChatbotPage';
import CheckinsPage from './src/pages/CheckinsPage';
import NotificationsPage from './src/pages/NotificationsPage';
import ProfilePage from './src/pages/ProfilePage';
import JournalPage from './src/pages/JournalPage';
import PersonaQuestionnairePage from './src/pages/PersonaQuestionnairePage';
import ViewPersonaPage from './src/pages/ViewPersonaPage';

// Import Firebase and Google Sign In
import { auth } from './src/database/firebase';
import { initializeGoogleSignIn } from './src/config/googleSignIn';
import { Palette } from './src/utils/palette';
import { buildApiUrl } from './src/config/api';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add web-specific scrollbar styles for better visibility
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        /* Custom scrollbar styles for mental health app */
        ::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        ::-webkit-scrollbar-track {
          background: #F0F4F8;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: #7C3AED;
          border-radius: 10px;
          border: 3px solid #F0F4F8;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6D28D9;
        }
        * {
          scrollbar-width: auto;
          scrollbar-color: #7C3AED #F0F4F8;
        }
        body, html {
          overflow-y: scroll !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Initialize Google Sign In
    initializeGoogleSignIn();

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // If user is signed in, ensure they exist in backend database
      if (user && user.email) {
        try {
          const response = await fetch(buildApiUrl('/user/profile', `?email=${user.email}`));
          const result = await response.json();
          console.log('Backend user profile initialized:', result);
        } catch (backendError) {
          console.log('Backend user creation error (non-critical):', backendError);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.backgroundColor }}>
        <ActivityIndicator size="large" color={Palette.mentalHealthBlue} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={Palette.mentalHealthBlue} />
      <Stack.Navigator
        initialRouteName={user ? "Home" : "SignIn"}
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          // Authenticated user screens
          <>
            <Stack.Screen name="Home" component={HomePage} />
            <Stack.Screen name="Journal" component={JournalPage} />
            <Stack.Screen name="MoodTracker" component={MoodTrackerPage} />
            <Stack.Screen name="Chatbot" component={ChatbotPage} />
            <Stack.Screen name="Checkins" component={CheckinsPage} />
            <Stack.Screen name="Notifications" component={NotificationsPage} />
            <Stack.Screen name="Profile" component={ProfilePage} />
            <Stack.Screen name="PersonaQuestionnaire" component={PersonaQuestionnairePage} />
            <Stack.Screen name="ViewPersona" component={ViewPersonaPage} />
          </>
        ) : (
          // Unauthenticated user screens
          <>
            <Stack.Screen name="SignIn" component={SignInPage} />
            <Stack.Screen name="SignUp" component={SignUpPage} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}