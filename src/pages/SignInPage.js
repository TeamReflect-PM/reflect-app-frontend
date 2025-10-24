import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
// import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../database/firebase';

import { buildApiUrl } from '../config/api';
// import { isWeb, checkGooglePlayServices } from '../config/googleSignIn';

const SignInPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);

  // Debug useEffect to track state changes
  useEffect(() => {
    console.log('State update - errors:', errors);
    console.log('State update - showErrors:', showErrors);
    console.log('State update - unverifiedUser:', unverifiedUser);
  }, [errors, showErrors, unverifiedUser]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    setShowErrors(true);

    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear unverified user when user starts typing again
    if (field === 'email' && unverifiedUser) {
      setUnverifiedUser(null);
    }
  };

  const handleEmailSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        console.log('email not verified:', userCredential.user.email);

        // Store the unverified user for potential resend verification
        setUnverifiedUser(userCredential.user);
        await signOut(auth); // Sign out unverified user

        // Clear any existing errors and immediately set verification error
        const verificationError = `Email verification required for ${userCredential.user.email}. Please check your email and click the verification link to complete your account setup.`;

        setErrors({ verification: verificationError });
        setShowErrors(true);
        setLoading(false);

        console.log('Email verification failed - showing error on screen');
        console.log('Error message:', verificationError);
        console.log('showErrors state:', true);

        return;
      }
      
      // Ensure user exists in backend database
      try {
        console.log('redirecting to backend api:' + userCredential.user.email);
        const hardcodedUrl = buildApiUrl('/user/profile', `?email=${userCredential.user.email}`);
        console.log('Using HARDCODED URL:', hardcodedUrl);
        const response = await fetch(hardcodedUrl);
        const result = await response.json();
        console.log('Backend user profile:', result);
        
        if (result.status === 'success') {
          console.log('User successfully created/found in backend:', result.data);
        }
      } catch (backendError) {
        console.log('Backend user creation error (non-critical):', backendError);
        // Don't show error for backend issues, just log them
      }

      navigation.replace('Home');
    } catch (error) {
      console.log('Sign in error:', error);

      // Set specific error messages based on Firebase error codes
      const newErrors = {};

      switch (error.code) {
        case 'auth/user-not-found':
          newErrors.email = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          newErrors.password = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          newErrors.email = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          newErrors.general = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          newErrors.general = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          newErrors.general = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/invalid-credential':
          newErrors.general = 'Invalid email or password. Please check your credentials and try again.';
          break;
        default:
          newErrors.general = error.message || 'An unexpected error occurred. Please try again.';
          break;
      }

      setErrors(newErrors);
      setShowErrors(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      const newErrors = { email: 'Please enter your email address first' };
      setErrors(newErrors);
      setShowErrors(true);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        'Password Reset Email Sent',
        'Please check your email for instructions to reset your password.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.log('Password reset error:', error);

      let errorMessage = 'Failed to send password reset email. Please try again.';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
      }

      Alert.alert('Password Reset Failed', errorMessage);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedUser) {
      Alert.alert('Error', 'Please try signing in again first.');
      return;
    }

    try {
      await sendEmailVerification(unverifiedUser);
      Alert.alert(
        'Verification Email Sent',
        'A new verification email has been sent to your email address. Please check your inbox and click the verification link.',
        [{ text: 'OK' }]
      );

      // Clear the verification error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.verification;
        return newErrors;
      });
    } catch (error) {
      console.log('Resend verification error:', error);

      let errorMessage = 'Failed to send verification email. Please try again.';

      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait a moment before requesting another verification email.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  // Temporarily commented out Google Sign-In
  // const handleGoogleSignIn = async () => {
  //   setLoading(true);
  //   try {
  //     let userEmail = null;
  //     
  //     if (isWeb) {
  //       const provider = new GoogleAuthProvider();
  //       const result = await signInWithPopup(auth, provider);
  //       userEmail = result.user.email;
  //     } else {
  //       const hasPlayServices = await checkGooglePlayServices();
  //       if (!hasPlayServices) {
  //         Alert.alert('Error', 'Google Play Services not available');
  //         return;
  //       }

  //       await GoogleSignin.hasPlayServices();
  //       const userInfo = await GoogleSignin.signIn();
  //       userEmail = userInfo.user.email;
  //       
  //       // You can use the userInfo to sign in with Firebase
  //     }
  //     
  //     // Ensure user exists in backend database
  //     if (userEmail) {
  //       try {
  //         const response = await fetch(`http://localhost:5000/user/profile?email=${userEmail}`);
  //         const result = await response.json();
  //         console.log('Backend user profile:', result);
  //       } catch (backendError) {
  //         console.log('Backend user creation error (non-critical):', backendError);
  //       }
  //     }
  //     
  //     navigation.replace('Home');
  //   } catch (error) {
  //     console.log('Google Sign In Error:', error);
  //     Alert.alert('Google Sign In Failed', error.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>

        <View style={styles.form}>
          {/* General error message */}
          {showErrors && errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          {/* Email verification error */}
          {showErrors && errors.verification && (
            <View style={styles.verificationContainer}>
              <Text style={styles.verificationText}>{errors.verification}</Text>
              {unverifiedUser && (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendVerification}
                >
                  <Text style={styles.resendButtonText}>Resend Verification Email</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Email field */}
          <View style={styles.fieldContainer}>
            <TextInput
              style={[
                styles.input,
                showErrors && errors.email ? styles.inputError : null
              ]}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#64748B"
            />
            {showErrors && errors.email && (
              <Text style={styles.fieldError}>{errors.email}</Text>
            )}
          </View>

          {/* Password field */}
          <View style={styles.fieldContainer}>
            <TextInput
              style={[
                styles.input,
                showErrors && errors.password ? styles.inputError : null
              ]}
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError('password');
              }}
              secureTextEntry
              placeholderTextColor="#64748B"
            />
            {showErrors && errors.password && (
              <Text style={styles.fieldError}>{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleEmailSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={"#FFFFFF"} />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Temporarily commented out Google Sign-In button */}
          {/* <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.signUpLink}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signUpLinkText}>
              Don't have an account? <Text style={styles.signUpLinkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: "#0F172A",
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 50,
  },
  subtitle: {
    fontSize: 18,
    color: "#64748B",
    textAlign: 'center',
    marginBottom: 48,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  form: {
    gap: 8,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
    fontSize: 18,
    color: "#0F172A",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  fieldError: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '500',
  },
  verificationContainer: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  verificationText: {
    color: '#e65100',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  resendButton: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: "#7C3AED",
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  googleButtonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: '600',
  },
  signUpLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  signUpLinkText: {
    color: "#64748B",
    fontSize: 14,
  },
  signUpLinkBold: {
    color: "#7C3AED",
    fontWeight: '600',
  },
});

export default SignInPage;