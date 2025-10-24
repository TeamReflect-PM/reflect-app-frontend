import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../database/firebase';
import { buildApiUrl } from '../config/api';

const ChatbotPage = () => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    checkProfileCompletion();

    // Initialize Web Speech API for web platform
    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setInputText(prev => prev + finalTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          Alert.alert('Permission Denied', 'Please allow microphone access to use voice input.');
        }
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const user = auth.currentUser;
      if (user?.email) {
        const response = await fetch(buildApiUrl('/get_persona', `?user_id=${user.email}`));
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.data) {
            // Check if profile is 100% complete
            const completionPercentage = result.data.persona_metadata?.completion_percentage || 0;
            if (completionPercentage === 100) {
              setProfileComplete(true);
              // Add welcome message
              const welcomeMessage = {
                id: '1',
                text: "Hi there! 🌟 I'm your personal wellness companion. I'm here to listen, support, and guide you through whatever you're experiencing. Whether you're feeling anxious, need motivation, or just want to talk about your day - I'm here for you. What's on your mind today?",
                isBot: true,
                timestamp: new Date().toISOString(),
              };
              setMessages([welcomeMessage]);
            } else {
              setProfileComplete(false);
            }
          } else {
            setProfileComplete(false);
          }
        } else {
          setProfileComplete(false);
        }
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setProfileComplete(false);
    } finally {
      setCheckingProfile(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      const chatData = {
        user_id: user.email,
        query: userMessage.text,
        top_k: 5,
      };

      const response = await fetch(buildApiUrl('/therapist'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: result.response,
          isBot: true,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(result.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. In the meantime, remember that you're not alone, and it's okay to feel whatever you're feeling. 💜",
        isBot: true,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (Platform.OS === 'web' && recognition) {
      if (isRecording) {
        recognition.stop();
        setIsRecording(false);
      } else {
        recognition.start();
        setIsRecording(true);
      }
    } else if (Platform.OS !== 'web') {
      Alert.alert('Voice Input', 'Voice input is currently available on web browsers only. Mobile voice input coming soon!');
    } else {
      Alert.alert('Not Supported', 'Your browser does not support voice recognition. Please use Chrome or Edge.');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isBot ? styles.botMessageContainer : styles.userMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.isBot ? styles.botBubble : styles.userBubble,
        item.isError && styles.errorBubble
      ]}>
        {item.isBot && (
          <Text style={styles.botIcon}>💜</Text>
        )}
        <Text style={[
          styles.messageText,
          item.isBot ? styles.botMessageText : styles.userMessageText
        ]}>
          {item.text}
        </Text>
      </View>
      <Text style={[
        styles.timestamp,
        item.isBot ? styles.botTimestamp : styles.userTimestamp
      ]}>
        {new Date(item.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </View>
  );

  if (checkingProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wellness Assistant</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Checking your profile...</Text>
        </View>
      </View>
    );
  }

  if (!profileComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wellness Assistant</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.profileIncompleteContainer}>
          <Text style={styles.profileIncompleteIcon}>🤖</Text>
          <Text style={styles.profileIncompleteTitle}>Complete Your Profile First</Text>
          <Text style={styles.profileIncompleteText}>
            To provide you with personalized wellness support, I need to understand you better.
            Please complete your personality profile first.
          </Text>
          <TouchableOpacity
            style={styles.completeProfileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.completeProfileButtonText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wellness Assistant</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.chatContainer}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            💜 Your Safe Space for Mental Wellness
          </Text>
          <Text style={styles.welcomeSubtext}>
            Share your thoughts, feelings, and experiences openly
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={true}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#7C3AED" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.voiceButtonSmall, isRecording && styles.voiceButtonActiveSmall]}
          onPress={toggleVoiceRecording}
        >
          <Text style={styles.voiceIconSmall}>{isRecording ? '🔴' : '🎤'}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Share what's on your mind..."
          placeholderTextColor="#64748B"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Text style={styles.sendButtonText}>💜</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#7C3AED",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: "#FFFFFF",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  placeholder: {
    width: 60,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },
  welcomeSection: {
    backgroundColor: "#EEF2FF",
    padding: 28,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: "#DDD6FE",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: "#7C3AED",
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  welcomeSubtext: {
    fontSize: 17,
    color: "#64748B",
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 24,
  },
  messageContainer: {
    marginBottom: 18,
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    marginBottom: 6,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  userBubble: {
    backgroundColor: "#7C3AED",
    borderBottomRightRadius: 6,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  errorBubble: {
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#F59E0B",
  },
  botIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  messageText: {
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  botMessageText: {
    color: "#0F172A",
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  timestamp: {
    fontSize: 13,
    marginHorizontal: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  botTimestamp: {
    color: "#9CA3AF",
    textAlign: 'left',
  },
  userTimestamp: {
    color: "#9CA3AF",
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#64748B",
    fontStyle: 'italic',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  profileIncompleteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    backgroundColor: "#F0F4F8",
  },
  profileIncompleteIcon: {
    fontSize: 100,
    marginBottom: 28,
  },
  profileIncompleteTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: "#0F172A",
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  profileIncompleteText: {
    fontSize: 19,
    color: "#64748B",
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  completeProfileButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 40,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  completeProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 2,
    borderTopColor: "#E0E7FF",
    gap: 16,
  },
  voiceButtonSmall: {
    backgroundColor: "#7C3AED",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceButtonActiveSmall: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  voiceIconSmall: {
    fontSize: 24,
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#DDD6FE",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 19,
    color: "#0F172A",
    maxHeight: 120,
    backgroundColor: "#FFFFFF",
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  sendButton: {
    backgroundColor: "#7C3AED",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.15,
  },
  sendButtonText: {
    fontSize: 24,
  },
});

export default ChatbotPage;