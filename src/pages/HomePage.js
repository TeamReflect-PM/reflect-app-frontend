import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../database/firebase';

const HomePage = () => {
  const navigation = useNavigation();
  const [showMenu, setShowMenu] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()} ${monthNames[date.getMonth()]} ${date.getDate()}`;
    setCurrentDate(formattedDate);
  }, []);

  const features = [
    {
      id: 1,
      icon: '📖',
      title: 'Digital Journal',
      description: 'Write and organize your thoughts, experiences, and daily reflections in a secure digital space.',
      route: 'Journal'
    },
    {
      id: 2,
      icon: '😊',
      title: 'Mood Tracker',
      description: 'Track your emotional well-being over time and identify patterns in your mental health.',
      route: 'MoodTracker'
    },
    {
      id: 3,
      icon: '🤖',
      title: 'AI Wellness Assistant',
      description: 'Get personalized insights and support from our AI chatbot trained in mental wellness.',
      route: 'Chatbot'
    },
    {
      id: 4,
      icon: '✅',
      title: 'Daily Check-ins',
      description: 'Regular wellness check-ins to help you stay mindful and track your progress.',
      route: 'Checkins'
    },
    {
      id: 5,
      icon: '👤',
      title: 'Personal Profile',
      description: 'Customize your experience with personality insights and personal preferences.',
      route: 'Profile'
    },
    {
      id: 6,
      icon: '🔔',
      title: 'Mindful Reminders',
      description: 'Gentle notifications to help you maintain healthy habits and self-care routines.',
      route: 'Notifications'
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace('SignIn');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleFeaturePress = (route) => {
    navigation.navigate(route);
  };

  const renderFeature = (feature) => (
    <TouchableOpacity
      key={feature.id}
      style={styles.featureCard}
      onPress={() => handleFeaturePress(feature.route)}
    >
      <Text style={styles.featureIcon}>{feature.icon}</Text>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureDescription}>{feature.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wellness Journal</Text>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Your Wellness Journey</Text>
          <Text style={styles.welcomeSubtitle}>
            Track your mental health, reflect on your experiences, and grow with personalized insights.
          </Text>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Explore Features</Text>
          <View style={styles.featuresGrid}>
            {features.map(feature => renderFeature(feature))}
          </View>
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessButtons}>
            <TouchableOpacity
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Journal')}
            >
              <Text style={styles.quickAccessIcon}>📝</Text>
              <Text style={styles.quickAccessText}>Write Journal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAccessButton}
              onPress={() => navigation.navigate('Chatbot')}
            >
              <Text style={styles.quickAccessIcon}>💬</Text>
              <Text style={styles.quickAccessText}>Chat with AI</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate('Journal');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemIcon}>📖</Text>
              <Text style={styles.menuItemText}>My Journal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate('MoodTracker');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemIcon}>😊</Text>
              <Text style={styles.menuItemText}>Mood Tracker</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate('Chatbot');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemIcon}>🤖</Text>
              <Text style={styles.menuItemText}>AI Chatbot</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate('Checkins');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemIcon}>✅</Text>
              <Text style={styles.menuItemText}>Check-ins</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate('Notifications');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemIcon}>🔔</Text>
              <Text style={styles.menuItemText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                navigation.navigate('Profile');
                setShowMenu(false);
              }}
            >
              <Text style={styles.menuItemIcon}>👤</Text>
              <Text style={styles.menuItemText}>My Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.menuItem, styles.signOutItem]}
              onPress={() => {
                setShowMenu(false);
                handleSignOut();
              }}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={styles.menuItemText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  menuButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 32,
  },
  welcomeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 36,
    marginBottom: 32,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  welcomeSubtitle: {
    fontSize: 19,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7C3AED',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 24,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  featuresContainer: {
    marginBottom: 28,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 26,
    marginBottom: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  featureIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  quickAccessSection: {
    marginBottom: 40,
  },
  quickAccessButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAccessButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: 28,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  quickAccessIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  quickAccessText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    margin: 28,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  signOutItem: {
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginTop: 16,
    paddingTop: 24,
    backgroundColor: '#FEF2F2',
  },
  menuItemIcon: {
    fontSize: 26,
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default HomePage;