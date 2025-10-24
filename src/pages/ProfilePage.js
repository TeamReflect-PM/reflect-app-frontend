import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../database/firebase';
import { buildApiUrl } from '../config/api';

const ProfilePage = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [personaData, setPersonaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
    loadPersonaData();
  }, []);

  // Add navigation listener to reload persona data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPersonaData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        setUserProfile({
          email: user.email,
          fullName: user.displayName || 'User',
          photoURL: user.photoURL
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadPersonaData = async () => {
    try {
      const user = auth.currentUser;
      if (user?.email) {
        const response = await fetch(buildApiUrl('/get_persona', `?user_id=${user.email}`));
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success') {
            setPersonaData(result.data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading persona data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaPress = () => {
    if (personaData) {
      navigation.navigate('ViewPersona', { personaData });
    } else {
      navigation.navigate('PersonaQuestionnaire');
    }
  };

  const handlePhotoUpload = async () => {
    if (Platform.OS === 'web') {
      // Web implementation using file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result;

            try {
              const user = auth.currentUser;
              if (user) {
                // Update user profile with photo URL
                setUserProfile(prev => ({
                  ...prev,
                  photoURL: base64data
                }));

                // TODO: Upload to Firebase Storage or your backend
                Alert.alert('Success', 'Profile photo updated successfully!');
              }
            } catch (error) {
              console.error('Error uploading photo:', error);
              Alert.alert('Error', 'Failed to upload photo. Please try again.');
            }
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    } else {
      // Mobile implementation - requires expo-image-picker
      Alert.alert(
        'Photo Upload',
        'Please install expo-image-picker package to enable photo upload on mobile.\n\nRun: npx expo install expo-image-picker'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoUpload}>
            {userProfile?.photoURL ? (
              <Image source={{ uri: userProfile.photoURL }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.defaultPhoto}>
                <Text style={styles.photoIcon}>📷</Text>
              </View>
            )}
            <View style={styles.photoOverlay}>
              <Text style={styles.photoOverlayText}>+</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePhotoUpload}>
            <Text style={styles.uploadButtonText}>Upload Photo</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Section */}
        <View style={styles.userInfoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{userProfile?.fullName || 'Loading...'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userProfile?.email || 'Loading...'}</Text>
          </View>
        </View>

        {/* Persona Section */}
        <View style={styles.personaSection}>
          <Text style={styles.sectionTitle}>Personality Profile</Text>
          <Text style={styles.sectionDescription}>
            Help us understand you better to provide personalized journal experiences.
          </Text>

          <TouchableOpacity
            style={styles.personaButton}
            onPress={handlePersonaPress}
            disabled={loading}
          >
            <View style={styles.personaButtonContent}>
              <Text style={styles.personaIcon}>
                {personaData ? '👤' : '✨'}
              </Text>
              <View style={styles.personaTextContainer}>
                <Text style={styles.personaButtonTitle}>
                  {personaData ? 'View Persona' : 'Fill up Persona'}
                </Text>
                <Text style={styles.personaButtonSubtitle}>
                  {personaData
                    ? 'Review and update your personality profile'
                    : 'Complete your personality questionnaire'}
                </Text>
              </View>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>

          {personaData && (
            <View style={styles.personaPreview}>
              <Text style={styles.previewTitle}>Profile Summary</Text>
              <Text style={styles.previewText}>
                Completion: {personaData.persona_metadata?.completion_percentage || 0}%
              </Text>
              {personaData.persona?.compulsory_fields?.preferred_name && (
                <Text style={styles.previewText}>
                  Preferred Name: {personaData.persona.compulsory_fields.preferred_name}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Privacy & Security</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Help & Support</Text>
            <Text style={styles.arrowIcon}>→</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
    paddingTop: 60,
    backgroundColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  // Photo Section
  photoSection: {
    alignItems: 'center',
    marginBottom: 36,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 18,
  },
  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#E0E7FF',
  },
  defaultPhoto: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E0E7FF',
  },
  photoIcon: {
    fontSize: 48,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  photoOverlayText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  uploadButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  uploadButtonText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '700',
  },
  // User Info Section
  userInfoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  infoItem: {
    marginBottom: 18,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A1F36',
    fontWeight: '600',
  },
  // Persona Section
  personaSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sectionDescription: {
    fontSize: 17,
    color: '#64748B',
    marginBottom: 28,
    lineHeight: 26,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  personaButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  personaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personaIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  personaTextContainer: {
    flex: 1,
  },
  personaButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  personaButtonSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#7C3AED',
    fontWeight: '800',
  },
  personaPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1F36',
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  previewText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  // Settings Section
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingText: {
    fontSize: 16,
    color: '#1A1F36',
    fontWeight: '600',
  },
});

export default ProfilePage;