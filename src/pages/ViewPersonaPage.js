import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const ViewPersonaPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { personaData } = route.params || {};

  if (!personaData || !personaData.persona) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Persona</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No persona data found</Text>
        </View>
      </View>
    );
  }

  const { persona, persona_metadata } = personaData;
  const { compulsory_fields, optional_fields } = persona;

  const formatLabel = (key) => {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      return value.map(item => formatLabel(item)).join(', ');
    }
    if (typeof value === 'string') {
      return formatLabel(value);
    }
    return value.toString();
  };

  const renderField = (key, value, isOptional = false) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    return (
      <View key={key} style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{formatLabel(key)}</Text>
        <Text style={styles.fieldValue}>{formatValue(value)}</Text>
      </View>
    );
  };

  const handleEditPersona = () => {
    navigation.navigate('PersonaQuestionnaire', { existingData: personaData });
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
        <Text style={styles.headerTitle}>My Persona</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditPersona}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Profile Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completion</Text>
              <Text style={styles.summaryValue}>
                {persona_metadata?.completion_percentage || 0}%
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Last Updated</Text>
              <Text style={styles.summaryValue}>
                {persona_metadata?.last_updated
                  ? new Date(persona_metadata.last_updated).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>
          {compulsory_fields?.preferred_name && (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Hello, {compulsory_fields.preferred_name}! 👋
              </Text>
            </View>
          )}
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌟 Basic Information</Text>
          <View style={styles.sectionContent}>
            {compulsory_fields && Object.entries(compulsory_fields)
              .filter(([key]) => ['preferred_name', 'age', 'gender', 'occupation', 'relationship_status'].includes(key))
              .map(([key, value]) => renderField(key, value))}
          </View>
        </View>

        {/* Communication Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Communication Style</Text>
          <View style={styles.sectionContent}>
            {compulsory_fields && Object.entries(compulsory_fields)
              .filter(([key]) => ['communication_style', 'preferred_tone', 'support_preferences'].includes(key))
              .map(([key, value]) => renderField(key, value))}
          </View>
        </View>

        {/* Current Context */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Life Context</Text>
          <View style={styles.sectionContent}>
            {compulsory_fields && Object.entries(compulsory_fields)
              .filter(([key]) => ['current_priorities', 'biggest_challenge', 'stress_response'].includes(key))
              .map(([key, value]) => renderField(key, value))}
          </View>
        </View>

        {/* Personality */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Personality & Approach</Text>
          <View style={styles.sectionContent}>
            {compulsory_fields && Object.entries(compulsory_fields)
              .filter(([key]) => ['personality_type', 'goal_approach'].includes(key))
              .map(([key, value]) => renderField(key, value))}
          </View>
        </View>

        {/* Optional Fields */}
        {optional_fields && Object.keys(optional_fields).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Additional Context</Text>
            <View style={styles.sectionContent}>
              {Object.entries(optional_fields).map(([key, value]) => renderField(key, value, true))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.editPersonaButton}
            onPress={handleEditPersona}
          >
            <Text style={styles.editPersonaButtonText}>✏️ Edit Persona</Text>
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
  editButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  welcomeContainer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  sectionContent: {
    gap: 12,
  },
  fieldContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F8',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
    color: '#0F172A',
    lineHeight: 22,
  },
  actionContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  editPersonaButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  editPersonaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ViewPersonaPage;