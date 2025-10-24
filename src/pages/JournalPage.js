import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../database/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildApiUrl } from '../config/api';

const JournalPage = () => {
  const navigation = useNavigation();
  const [journalText, setJournalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [journals, setJournals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    loadJournals();

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
          setJournalText(prev => prev + finalTranscript);
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

  const loadJournals = async () => {
    try {
      const user = auth.currentUser;
      if (user?.email) {
        const response = await fetch(buildApiUrl('/get_user_journals', `?user_id=${user.email}&limit=50`));
        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success') {
            // Transform backend data to match frontend format
            const formattedJournals = result.data.map(journal => {
              let timestamp;
              try {
                if (journal.created_at && journal.created_at._seconds) {
                  timestamp = new Date(journal.created_at._seconds * 1000).toISOString();
                } else if (journal.created_at) {
                  timestamp = new Date(journal.created_at).toISOString();
                } else {
                  timestamp = new Date().toISOString();
                }
              } catch (e) {
                console.warn('Invalid date for journal:', journal.journal_id, e);
                timestamp = new Date().toISOString();
              }

              return {
                id: journal.journal_id,
                text: journal.journal_text,
                summary: journal.summary,
                metadata: journal.metadata,
                timestamp: timestamp,
                date: timestamp
              };
            });
            setJournals(formattedJournals);
          }
        } else {
          // Fallback to local storage if API fails
          const storedJournals = await AsyncStorage.getItem('journals');
          if (storedJournals) {
            setJournals(JSON.parse(storedJournals));
          }
        }
      }
    } catch (error) {
      console.error('Error loading journals:', error);
      // Fallback to local storage
      try {
        const storedJournals = await AsyncStorage.getItem('journals');
        if (storedJournals) {
          setJournals(JSON.parse(storedJournals));
        }
      } catch (storageError) {
        console.error('Error loading from storage:', storageError);
      }
    }
  };

  const saveJournalToStorage = async (newJournal) => {
    try {
      const storedJournals = await AsyncStorage.getItem('journals');
      const currentJournals = storedJournals ? JSON.parse(storedJournals) : [];
      currentJournals.unshift(newJournal);
      await AsyncStorage.setItem('journals', JSON.stringify(currentJournals));
      setJournals(currentJournals);
    } catch (error) {
      console.error('Error saving journal to storage:', error);
    }
  };

  const handleSaveJournal = async () => {
    if (!journalText.trim()) {
      Alert.alert('Empty Journal', 'Please write something in your journal before saving.');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert('Error', 'User not authenticated');
        setLoading(false);
        return;
      }

      const journalData = {
        user_id: user.email,
        journal_text: journalText.trim(),
      };

      // Call reflect-git-backend API
      const response = await fetch(buildApiUrl('/store_journal'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journalData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        Alert.alert('Success', 'Journal saved successfully!');
        setJournalText('');
        setShowAddForm(false);

        // Reload journals from backend to get the latest data
        await loadJournals();
      } else {
        Alert.alert('Error', result.message || 'Failed to save journal');
      }
    } catch (error) {
      console.error('Error saving journal:', error);
      Alert.alert('Error', 'Network error. Journal saved locally only.');
      
      // Save locally even if API fails
      const newJournal = {
        id: Date.now().toString(),
        text: journalText.trim(),
        date: new Date().toISOString(),
        user_id: auth.currentUser?.email || 'unknown',
        synced: false,
      };
      
      await saveJournalToStorage(newJournal);
      setJournalText('');
      setShowAddForm(false);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJournals();
    setRefreshing(false);
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

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  const renderJournalEntry = ({ item }) => (
    <View style={styles.journalEntry}>
      <View style={styles.journalHeader}>
        <Text style={styles.journalDate}>{formatDate(item.timestamp || item.date)}</Text>
        {!item.synced && <Text style={styles.unsyncedIndicator}>Local Only</Text>}
        {item.metadata?.mood && (
          <Text style={styles.moodTag}>{item.metadata.mood}</Text>
        )}
      </View>

      {/* Show summary if available, otherwise show full text */}
      {item.summary ? (
        <View>
          <Text style={styles.journalSummary}>{item.summary}</Text>
          {item.metadata?.tags && item.metadata.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.metadata.tags.slice(0, 3).map((tag, index) => (
                <Text key={index} style={styles.tag}>#{tag}</Text>
              ))}
            </View>
          )}
        </View>
      ) : (
        <Text style={styles.journalText} numberOfLines={4}>{item.text}</Text>
      )}
    </View>
  );

  if (showAddForm) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowAddForm(false)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Journal Entry</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          <View style={styles.addForm}>
            <Text style={styles.promptText}>
              How are you feeling today? Share your thoughts, emotions, and experiences...
            </Text>
            
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Write your journal entry here..."
              placeholderTextColor="#64748B"
              value={journalText}
              onChangeText={setJournalText}
              autoFocus
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                onPress={toggleVoiceRecording}
              >
                <Text style={styles.voiceButtonIcon}>{isRecording ? '🔴' : '🎤'}</Text>
                <Text style={styles.voiceButtonText}>
                  {isRecording ? 'Stop Recording' : 'Voice Input'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSaveJournal}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Entry'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Journal</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Text style={styles.addButtonText}>✏️ Write New Entry</Text>
        </TouchableOpacity>

        {journals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📖</Text>
            <Text style={styles.emptyStateTitle}>Start Your Journey</Text>
            <Text style={styles.emptyStateText}>
              Begin documenting your thoughts, feelings, and daily experiences. 
              Journaling can help improve your mental well-being and self-awareness.
            </Text>
          </View>
        ) : (
          <FlatList
            data={journals}
            renderItem={renderJournalEntry}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#7C3AED']}
                tintColor="#7C3AED"
              />
            }
            contentContainerStyle={styles.journalList}
          />
        )}
      </View>
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
    padding: 32,
  },
  addButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 22,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyStateIcon: {
    fontSize: 100,
    marginBottom: 28,
  },
  emptyStateTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  emptyStateText: {
    fontSize: 19,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  journalList: {
    paddingBottom: 24,
  },
  journalEntry: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  journalDate: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  unsyncedIndicator: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  moodTag: {
    fontSize: 11,
    color: '#7C3AED',
    fontWeight: '700',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    textTransform: 'capitalize',
  },
  journalText: {
    fontSize: 18,
    color: '#0F172A',
    lineHeight: 28,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  journalSummary: {
    fontSize: 18,
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '800',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  addForm: {
    flex: 1,
  },
  promptText: {
    fontSize: 22,
    color: '#7C3AED',
    fontWeight: '800',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    fontSize: 19,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 360,
    marginBottom: 32,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E0E7FF',
    fontWeight: '500',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  voiceButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  voiceButtonIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.15,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

export default JournalPage;