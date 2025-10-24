import React, { useState } from 'react';
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
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '../database/firebase';

const SignUpPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showErrors, setShowErrors] = useState(false);

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
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification (OTP)
      await sendEmailVerification(userCredential.user);

      // Sign out the user so they don't get auto-redirected to Home
      await signOut(auth);

      setOtpSent(true);

      // Clear any previous errors
      setErrors({});
      setShowErrors(false);

      Alert.alert(
        'Account Created Successfully! 🎉',
        'A verification email has been sent to your email address. Please check your email and click the verification link to complete your registration. You will now be redirected to the sign-in page.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );

      // Auto redirect to sign in page after 2 seconds
      setTimeout(() => {
        navigation.navigate('SignIn');
      }, 2000);
    } catch (error) {
      console.log('Sign up error:', error);

      // Set specific error messages based on Firebase error codes
      const newErrors = {};

      switch (error.code) {
        case 'auth/email-already-in-use':
          newErrors.email = 'This email is already registered. Please use a different email.';
          // Reset form fields
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setOtpSent(false);
          break;
        case 'auth/invalid-email':
          newErrors.email = 'Invalid email address format.';
          break;
        case 'auth/weak-password':
          newErrors.password = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/network-request-failed':
          newErrors.general = 'Network error. Please check your internet connection and try again.';
          break;
        case 'auth/too-many-requests':
          newErrors.general = 'Too many failed attempts. Please try again later.';
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.content}>
        <Text style={styles.title}>Join us to start your wellness journey</Text>

        <View style={styles.form}>
          {/* General error message */}
          {showErrors && errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
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

          {/* Confirm Password field */}
          <View style={styles.fieldContainer}>
            <TextInput
              style={[
                styles.input,
                showErrors && errors.confirmPassword ? styles.inputError : null
              ]}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                clearError('confirmPassword');
              }}
              secureTextEntry
              placeholderTextColor="#64748B"
            />
            {showErrors && errors.confirmPassword && (
              <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
            )}
          </View>

          {otpSent && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                ✅ Account created successfully! Verification email sent to your inbox.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInLink}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.signInLinkText}>
              Already have an account? <Text style={styles.signInLinkBold}>Sign In</Text>
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
    backgroundColor: '#F0F4F8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 56,
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: 50,
  },
  form: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    fontSize: 18,
    color: '#0F172A',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 15,
    marginTop: 8,
    marginLeft: 8,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 5,
    borderLeftColor: '#EF4444',
    padding: 20,
    marginBottom: 24,
    borderRadius: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  successContainer: {
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
    padding: 20,
    marginBottom: 24,
    borderRadius: 16,
  },
  successText: {
    color: '#065F46',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  signUpButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  signInLink: {
    alignItems: 'center',
    marginTop: 28,
  },
  signInLinkText: {
    color: '#64748B',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  signInLinkBold: {
    color: '#7C3AED',
    fontWeight: '800',
  },
});

export default SignUpPage;