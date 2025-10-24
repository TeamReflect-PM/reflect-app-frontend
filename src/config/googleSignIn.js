import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';

export const PLATFORM_INFO = {
  isWeb,
  isMobile,
  platform: Platform.OS
};

export const initializeGoogleSignIn = () => {
  if (isMobile) {
    GoogleSignin.configure({
      webClientId: 'YOUR_WEB_CLIENT_ID', // From Google Cloud Console
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }
};

export const checkGooglePlayServices = async () => {
  if (Platform.OS === 'android') {
    try {
      await GoogleSignin.hasPlayServices();
      return true;
    } catch (error) {
      console.log('Google Play Services not available');
      return false;
    }
  }
  return true;
};