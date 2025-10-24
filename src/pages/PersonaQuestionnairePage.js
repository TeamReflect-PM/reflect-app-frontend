import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth } from '../database/firebase';
import { buildApiUrl } from '../config/api';
import { Palette } from '../utils/palette';

// Question configuration data adapted from persona.md
const QUESTIONNAIRE_CONFIG = {
  compulsoryFields: [
    {
      id: 'preferred_name',
      question: 'What would you like me to call you?',
      type: 'text',
      required: true,
      placeholder: 'Enter your preferred name',
    },
    {
      id: 'age',
      question: 'How old are you?',
      type: 'number',
      required: true,
      placeholder: 'Enter your age',
    },
    {
      id: 'gender',
      question: 'How do you identify?',
      type: 'single_select',
      required: true,
      options: [
        { value: 'female', label: 'Female' },
        { value: 'male', label: 'Male' },
        { value: 'non_binary', label: 'Non-binary' },
        { value: 'other', label: 'Other' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' }
      ]
    },
    {
      id: 'occupation',
      question: 'What is your occupation?',
      type: 'text',
      required: true,
      placeholder: 'e.g., Software Engineer, Teacher, Student',
    },
    {
      id: 'relationship_status',
      question: 'What is your current relationship status?',
      type: 'single_select',
      required: true,
      options: [
        { value: 'single', label: 'Single' },
        { value: 'in_relationship', label: 'In a relationship' },
        { value: 'married', label: 'Married' },
        { value: 'married_with_children', label: 'Married with children' },
        { value: 'divorced', label: 'Divorced' },
        { value: 'widowed', label: 'Widowed' },
        { value: 'its_complicated', label: "It's complicated" }
      ]
    },
    {
      id: 'communication_style',
      question: 'How do you prefer conversations to feel?',
      type: 'single_select',
      required: true,
      description: 'This helps me communicate with you in the way you find most comfortable.',
      options: [
        {
          value: 'supportive',
          label: 'Warm and supportive',
          description: 'Empathy and understanding first'
        },
        {
          value: 'direct',
          label: 'Direct and straightforward',
          description: 'Get to the point, no fluff'
        },
        {
          value: 'analytical',
          label: 'Analytical and detailed',
          description: 'Thorough explanations with context'
        },
        {
          value: 'casual',
          label: 'Casual and friendly',
          description: 'Relaxed and conversational'
        }
      ]
    },
    {
      id: 'preferred_tone',
      question: 'What tone would you like me to use with you?',
      type: 'single_select',
      required: true,
      options: [
        { value: 'encouraging', label: 'Encouraging - Uplifting and motivating' },
        { value: 'straightforward', label: 'Straightforward - Honest and direct' },
        { value: 'calm', label: 'Calm and steady - Peaceful and grounding' },
        { value: 'enthusiastic', label: 'Enthusiastic - Energetic and exciting' },
        { value: 'thoughtful', label: 'Thoughtful - Reflective and wise' }
      ]
    },
    {
      id: 'support_preferences',
      question: 'When you\'re struggling, what kind of support helps most?',
      type: 'multi_select',
      required: true,
      maxSelections: 3,
      description: 'Select up to 3 that resonate most with you.',
      options: [
        { value: 'empathy', label: 'Empathy - Someone who truly understands how I feel' },
        { value: 'practical_advice', label: 'Practical advice - Concrete steps I can take' },
        { value: 'validation', label: 'Validation - Confirmation that my feelings are normal' },
        { value: 'clear_action_steps', label: 'Clear action steps - Specific, organized guidance' },
        { value: 'recognition', label: 'Recognition - Acknowledgment of my efforts and progress' },
        { value: 'creative_solutions', label: 'Creative solutions - Innovative approaches' },
        { value: 'gentle_challenges', label: 'Gentle challenges - Push me to grow, but kindly' }
      ]
    },
    {
      id: 'current_priorities',
      question: 'What are your top 3 priorities in life right now?',
      type: 'multi_select',
      required: true,
      exactSelections: 3,
      description: 'Select exactly 3 that matter most to you currently.',
      options: [
        { value: 'career_growth', label: 'Career growth - Advancing in my field' },
        { value: 'mental_wellness', label: 'Mental wellness - Emotional health and balance' },
        { value: 'relationship_health', label: 'Relationship health - Romantic partnership' },
        { value: 'family_wellbeing', label: 'Family wellbeing - Family relationships' },
        { value: 'physical_health', label: 'Physical health - Fitness and wellness' },
        { value: 'financial_security', label: 'Financial security - Money and stability' },
        { value: 'personal_growth', label: 'Personal growth - Self-improvement' },
        { value: 'social_connections', label: 'Social connections - Friendships' },
        { value: 'creative_fulfillment', label: 'Creative fulfillment - Artistic expression' },
        { value: 'work_life_balance', label: 'Work-life balance - Managing demands' }
      ]
    },
    {
      id: 'biggest_challenge',
      question: 'What\'s your biggest challenge or struggle right now?',
      type: 'textarea',
      required: true,
      placeholder: 'e.g., managing work anxiety and imposter syndrome',
      maxLength: 200,
      description: 'This helps me provide relevant support and understand your current context.'
    },
    {
      id: 'stress_response',
      question: 'When you\'re stressed or overwhelmed, you typically:',
      type: 'single_select',
      required: true,
      options: [
        { value: 'seek_support_and_problem_solve', label: 'Seek support and problem-solve - Talk to others AND take action' },
        { value: 'problem_solve_methodically', label: 'Problem-solve methodically - Work through it step by step alone' },
        { value: 'talk_through_with_others', label: 'Talk through with others - Process by discussing' },
        { value: 'withdraw_and_think_alone', label: 'Withdraw and think alone - Need space to figure things out' },
        { value: 'stay_busy_and_distracted', label: 'Stay busy and distracted - Keep moving to avoid dwelling' },
        { value: 'exercise_and_physical_activity', label: 'Exercise and physical activity - Work it out through movement' }
      ]
    },
    {
      id: 'personality_type',
      question: 'How would you describe your personality in a few words?',
      type: 'text',
      required: true,
      placeholder: 'e.g., thoughtful and anxious optimist',
      maxLength: 100,
      description: 'Examples: "introverted but warm", "driven perfectionist", "creative and spontaneous"'
    },
    {
      id: 'goal_approach',
      question: 'Your approach to goals and planning is:',
      type: 'single_select',
      required: true,
      options: [
        { value: 'process_focused_with_flexibility', label: 'Process-focused with flexibility - Care about systems, adapt as needed' },
        { value: 'outcome_focused_with_milestones', label: 'Outcome-focused with milestones - Specific targets and deadlines' },
        { value: 'experimental_with_pivots', label: 'Experimental with pivots - Try things and adjust often' },
        { value: 'detailed_planning_and_execution', label: 'Detailed planning and execution - Thorough preparation' },
        { value: 'loose_planning_adapt_as_go', label: 'Loose planning, adapt as I go - General direction, figure out details later' },
        { value: 'intuitive_go_with_flow', label: 'Intuitive, go with flow - Follow instincts and opportunities' }
      ]
    }
  ],

  optionalFields: [
    {
      id: 'cultural_background',
      question: 'What cultural or ethnic background do you identify with?',
      type: 'text',
      required: false,
      placeholder: 'e.g., Chinese-American, Nigerian, Mixed heritage',
      description: 'This helps me understand cultural values and communication styles. Feel free to skip.',
      maxLength: 100
    },
    {
      id: 'learning_style',
      question: 'How do you learn and process information best?',
      type: 'single_select',
      required: false,
      options: [
        { value: 'visual_and_hands_on', label: 'Visual and hands-on - I need to see and do things' },
        { value: 'reading_and_systematic', label: 'Reading and systematic practice - I learn through study' },
        { value: 'listening_and_discussion', label: 'Listening and discussion - I process through conversation' },
        { value: 'experimentation_and_trial', label: 'Experimentation and trial - I learn by trying things out' },
        { value: 'structured_step_by_step', label: 'Structured step-by-step - I need clear, organized instruction' }
      ]
    }
  ]
};

// Question flow and grouping
const QUESTION_FLOW = {
  sections: [
    {
      id: 'basic_info',
      title: 'Let\'s start with the basics',
      subtitle: 'Tell me a bit about yourself',
      icon: '👋',
      questions: ['preferred_name', 'age', 'gender', 'occupation', 'relationship_status']
    },
    {
      id: 'communication',
      title: 'How you like to communicate',
      subtitle: 'This helps me support you in the way that works best',
      icon: '💬',
      questions: ['communication_style', 'preferred_tone', 'support_preferences']
    },
    {
      id: 'current_context',
      title: 'Your current life context',
      subtitle: 'What matters to you right now',
      icon: '🎯',
      questions: ['current_priorities', 'biggest_challenge', 'stress_response']
    },
    {
      id: 'personality',
      title: 'Your personality and approach',
      subtitle: 'Help me understand how you think and work',
      icon: '🧠',
      questions: ['personality_type', 'goal_approach']
    },
    {
      id: 'optional_context',
      title: 'Additional context (Optional)',
      subtitle: 'These help me provide even better support, but feel free to skip any',
      icon: '⭐',
      questions: ['cultural_background', 'learning_style']
    }
  ]
};

const PersonaQuestionnairePage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { existingData } = route.params || {};
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data if editing existing persona
  useEffect(() => {
    if (existingData && existingData.persona) {
      const flatData = {
        ...existingData.persona.compulsory_fields,
        ...existingData.persona.optional_fields
      };
      setFormData(flatData);
    }
  }, [existingData]);

  const currentSection = QUESTION_FLOW.sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === QUESTION_FLOW.sections.length - 1;

  const getQuestionConfig = (questionId) => {
    return [...QUESTIONNAIRE_CONFIG.compulsoryFields, ...QUESTIONNAIRE_CONFIG.optionalFields]
      .find(q => q.id === questionId);
  };

  const handleValueChange = (questionId, value) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));

    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: null }));
    }
  };

  const renderTextInput = (config) => {
    const value = formData[config.id] || '';
    const error = errors[config.id];

    return (
      <View style={styles.questionContainer} key={config.id}>
        <Text style={styles.questionText}>{config.question}</Text>
        {config.description && (
          <Text style={styles.descriptionText}>{config.description}</Text>
        )}

        <TextInput
          style={[
            config.type === 'textarea' ? styles.textArea : styles.textInput,
            error ? styles.errorInput : null
          ]}
          value={value}
          onChangeText={(text) => handleValueChange(config.id, text)}
          placeholder={config.placeholder}
          multiline={config.type === 'textarea'}
          maxLength={config.maxLength}
          keyboardType={config.type === 'number' ? 'numeric' : 'default'}
          placeholderTextColor={Palette.mentalHealthGray}
        />

        {config.maxLength && (
          <Text style={styles.charCount}>
            {value.length}/{config.maxLength}
          </Text>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const renderSingleSelect = (config) => {
    const value = formData[config.id];
    const error = errors[config.id];

    return (
      <View style={styles.questionContainer} key={config.id}>
        <Text style={styles.questionText}>{config.question}</Text>
        {config.description && (
          <Text style={styles.descriptionText}>{config.description}</Text>
        )}

        <View style={styles.optionsContainer}>
          {config.options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                value === option.value && styles.selectedOption
              ]}
              onPress={() => handleValueChange(config.id, option.value)}
            >
              <View style={[
                styles.radio,
                value === option.value && styles.selectedRadio
              ]}>
                {value === option.value && <View style={styles.radioInner} />}
              </View>

              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  value === option.value && styles.selectedOptionLabel
                ]}>
                  {option.label}
                </Text>
                {option.description && (
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const renderMultiSelect = (config) => {
    const value = formData[config.id] || [];
    const error = errors[config.id];

    const handleOptionPress = (optionValue) => {
      const newValue = [...value];
      const index = newValue.indexOf(optionValue);

      if (index > -1) {
        // Remove if already selected
        newValue.splice(index, 1);
      } else {
        // Add if not selected and under limit
        if (!config.maxSelections || newValue.length < config.maxSelections) {
          newValue.push(optionValue);
        }
      }

      handleValueChange(config.id, newValue);
    };

    const isSelected = (optionValue) => value.includes(optionValue);
    const isDisabled = (optionValue) => {
      return config.maxSelections && !isSelected(optionValue) && value.length >= config.maxSelections;
    };

    const getSelectionText = () => {
      if (config.exactSelections) {
        return `Select exactly ${config.exactSelections} (${value.length}/${config.exactSelections})`;
      } else if (config.maxSelections) {
        return `Select up to ${config.maxSelections} (${value.length}/${config.maxSelections})`;
      }
      return `Selected: ${value.length}`;
    };

    return (
      <View style={styles.questionContainer} key={config.id}>
        <Text style={styles.questionText}>{config.question}</Text>
        {config.description && (
          <Text style={styles.descriptionText}>{config.description}</Text>
        )}

        <Text style={styles.selectionCount}>{getSelectionText()}</Text>

        <View style={styles.optionsContainer}>
          {config.options.map((option) => {
            const selected = isSelected(option.value);
            const disabled = isDisabled(option.value);

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  selected && styles.selectedOption,
                  disabled && styles.disabledOption
                ]}
                onPress={() => !disabled && handleOptionPress(option.value)}
                disabled={disabled}
              >
                <View style={[
                  styles.checkbox,
                  selected && styles.selectedCheckbox
                ]}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>

                <Text style={[
                  styles.optionLabel,
                  selected && styles.selectedOptionLabel,
                  disabled && styles.disabledOptionLabel
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const renderQuestion = (questionId) => {
    const config = getQuestionConfig(questionId);
    if (!config) return null;

    switch (config.type) {
      case 'text':
      case 'textarea':
      case 'number':
        return renderTextInput(config);
      case 'single_select':
        return renderSingleSelect(config);
      case 'multi_select':
        return renderMultiSelect(config);
      default:
        return null;
    }
  };

  const validateCurrentSection = () => {
    const sectionErrors = {};
    let hasErrors = false;

    currentSection.questions.forEach(questionId => {
      const config = getQuestionConfig(questionId);
      const value = formData[questionId];

      // Only validate required fields
      if (config.required) {
        if (!value || (Array.isArray(value) && value.length === 0)) {
          sectionErrors[questionId] = 'This field is required';
          hasErrors = true;
        } else if (config.exactSelections && Array.isArray(value) && value.length !== config.exactSelections) {
          sectionErrors[questionId] = `Please select exactly ${config.exactSelections} options`;
          hasErrors = true;
        } else if (config.type === 'number') {
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue < 13 || numValue > 120) {
            sectionErrors[questionId] = 'Please enter a valid age between 13 and 120';
            hasErrors = true;
          }
        }
      }
    });

    setErrors(sectionErrors);
    return !hasErrors;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      if (isLastSection) {
        handleSubmit();
      } else {
        setCurrentSectionIndex(currentSectionIndex + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const generatePersonaJSON = (data) => {
    const compulsoryData = {};
    const optionalData = {};

    // Separate compulsory and optional fields
    QUESTIONNAIRE_CONFIG.compulsoryFields.forEach(field => {
      if (data[field.id] !== undefined) {
        compulsoryData[field.id] = data[field.id];
      }
    });

    QUESTIONNAIRE_CONFIG.optionalFields.forEach(field => {
      if (data[field.id] !== undefined && data[field.id] !== null && data[field.id] !== '') {
        optionalData[field.id] = data[field.id];
      }
    });

    // Calculate completion percentage
    const totalFields = QUESTIONNAIRE_CONFIG.compulsoryFields.length + QUESTIONNAIRE_CONFIG.optionalFields.length;
    const completedFields = Object.keys(compulsoryData).length + Object.keys(optionalData).length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    const user = auth.currentUser;
    return {
      user_id: user.email,
      persona: {
        compulsory_fields: compulsoryData,
        optional_fields: optionalData
      },
      persona_metadata: {
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        completion_percentage: completionPercentage,
        compulsory_completed: Object.keys(compulsoryData).length === QUESTIONNAIRE_CONFIG.compulsoryFields.length,
        optional_completed: Object.keys(optionalData).length
      }
    };
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Generate the final persona JSON
      const personaData = generatePersonaJSON(formData);

      // Submit to backend using /store_persona endpoint
      const response = await fetch(buildApiUrl('/store_persona'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        Alert.alert('Success!', 'Your persona has been saved successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(result.message || 'Failed to save persona');
      }

    } catch (error) {
      console.error('Error saving persona:', error);
      Alert.alert('Error', 'There was an error saving your persona. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressPercentage = () => {
    return ((currentSectionIndex + 1) / QUESTION_FLOW.sections.length) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Persona Questionnaire</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${getProgressPercentage()}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentSectionIndex + 1} of {QUESTION_FLOW.sections.length}
        </Text>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{currentSection.icon}</Text>
        <Text style={styles.sectionTitle}>{currentSection.title}</Text>
        <Text style={styles.sectionSubtitle}>{currentSection.subtitle}</Text>
      </View>

      {/* Questions */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentSection.questions.map(questionId => renderQuestion(questionId))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {currentSectionIndex > 0 && (
          <TouchableOpacity
            style={styles.backNavigationButton}
            onPress={handlePrevious}
          >
            <Text style={styles.backNavigationButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            currentSectionIndex === 0 && styles.fullWidthButton
          ]}
          onPress={handleNext}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>
            {isLoading ? 'Saving...' : isLastSection ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Palette.mentalHealthBlue,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: Palette.mentalHealthWhite,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Palette.mentalHealthWhite,
  },
  placeholder: {
    width: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Palette.mentalHealthWhite,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Palette.backgroundColor,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.mentalHealthBlue,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Palette.mentalHealthGray,
    minWidth: 60,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: Palette.mentalHealthWhite,
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Palette.mentalHealthDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Palette.mentalHealthGray,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.mentalHealthDark,
    marginBottom: 8,
    lineHeight: 22,
  },
  descriptionText: {
    fontSize: 14,
    color: Palette.mentalHealthGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Palette.mentalHealthWhite,
    minHeight: 50,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Palette.mentalHealthWhite,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: '#ff4444',
  },
  charCount: {
    fontSize: 12,
    color: Palette.mentalHealthGray,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ff4444',
    marginTop: 4,
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: Palette.mentalHealthWhite,
  },
  selectedOption: {
    borderColor: Palette.mentalHealthBlue,
    backgroundColor: Palette.mentalHealthLightBlue,
  },
  disabledOption: {
    opacity: 0.5,
    backgroundColor: '#f8f8f8',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: Palette.mentalHealthBlue,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.mentalHealthBlue,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckbox: {
    borderColor: Palette.mentalHealthBlue,
    backgroundColor: Palette.mentalHealthBlue,
  },
  checkmark: {
    color: Palette.mentalHealthWhite,
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    color: Palette.mentalHealthDark,
    lineHeight: 20,
  },
  selectedOptionLabel: {
    color: Palette.mentalHealthBlue,
    fontWeight: '500',
  },
  disabledOptionLabel: {
    color: '#999',
  },
  optionDescription: {
    fontSize: 12,
    color: Palette.mentalHealthGray,
    marginTop: 4,
    lineHeight: 16,
  },
  selectionCount: {
    fontSize: 12,
    color: Palette.mentalHealthBlue,
    marginBottom: 12,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Palette.mentalHealthWhite,
    borderTopWidth: 1,
    borderTopColor: Palette.backgroundColor,
    gap: 12,
  },
  backNavigationButton: {
    flex: 1,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Palette.mentalHealthBlue,
    borderRadius: 12,
    alignItems: 'center',
  },
  backNavigationButtonText: {
    color: Palette.mentalHealthBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: Palette.mentalHealthBlue,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullWidthButton: {
    flex: 2,
  },
  nextButtonText: {
    color: Palette.mentalHealthWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PersonaQuestionnairePage;