import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { UserSettings } from '../types';
import { StorageService } from '../services/storageService';

type PersonalizationQuizScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PersonalizationQuiz'>;

interface QuizQuestion {
  id: string;
  title: string;
  type: 'single' | 'multiple' | 'text';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'profession',
    title: 'What do you do for work?',
    type: 'single',
    options: [
      'Student',
      'Software Engineer',
      'Marketing',
      'Sales',
      'Healthcare',
      'Education',
      'Finance',
      'Creative/Arts',
      'Service Industry',
      'Other',
      'Prefer not to say'
    ],
    required: false
  },
  {
    id: 'personality',
    title: 'How would you describe your personality? (Select all that apply)',
    type: 'multiple',
    options: [
      'Shy/Introverted',
      'Outgoing/Extroverted',
      'Anxious/Worrier',
      'Confident/Bold',
      'Lazy/Procrastinator',
      'Perfectionist',
      'Chaotic/Spontaneous',
      'Organized/Planner',
      'Sensitive/Emotional',
      'Sarcastic/Witty'
    ],
    required: false
  },
  {
    id: 'location',
    title: 'Where are you from?',
    type: 'single',
    options: [
      'Los Angeles',
      'New York City',
      'Texas',
      'Florida',
      'Seattle',
      'Portland',
      'Chicago',
      'Boston',
      'Nashville',
      'Las Vegas',
      'Other',
      'Prefer not to say'
    ],
    required: false
  },
  {
    id: 'interests',
    title: 'What are your main interests? (Select all that apply)',
    type: 'multiple',
    options: [
      'Fitness/Working Out',
      'Gaming',
      'Social Media',
      'Music',
      'Cooking',
      'Travel',
      'Reading',
      'Sports',
      'Art/Creative',
      'Photography',
      'Coffee',
      'Wine/Alcohol'
    ],
    required: false
  },
  {
    id: 'characteristics',
    title: 'Any notable physical characteristics? (Select all that apply)',
    type: 'multiple',
    options: [
      'Tall',
      'Short',
      'Bald',
      'Beard/Facial Hair',
      'Glasses',
      'Tattoos',
      'Piercings',
      'Muscular',
      'Skinny',
      'Curvy',
      'None of the above'
    ],
    required: false
  },
  {
    id: 'circumstances',
    title: 'What\'s your current life situation? (Select all that apply)',
    type: 'multiple',
    options: [
      'Single',
      'Married',
      'Divorced',
      'Parent',
      'Student',
      'Unemployed',
      'Rich/Wealthy',
      'Poor/Broke',
      'Living with Parents',
      'Have Roommates',
      'None of the above'
    ],
    required: false
  },
  {
    id: 'additional',
    title: 'Anything else you want the AI to know about you? (Optional)',
    type: 'text',
    placeholder: 'Tell us about yourself...',
    required: false
  }
];

export default function PersonalizationQuizScreen() {
  const navigation = useNavigation<PersonalizationQuizScreenNavigationProp>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === QUIZ_QUESTIONS.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswer = (answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Personalization?',
      'You can always personalize later in settings. The AI will still work, just with less personal roasts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: () => navigation.navigate('Home') }
      ]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Save personalization data
      const storage = new StorageService();
      const currentSettings = await storage.getSettings();
      
      const updatedSettings: UserSettings = {
        ...currentSettings,
        personalization: answers
      };
      
      await storage.saveSettings(updatedSettings);
      
      console.log('💾 Saved Personalization Data:', answers);
      console.log('💾 Updated Settings:', updatedSettings);
      
      Alert.alert(
        'Personalization Complete!',
        'Your AI roasts will now be tailored to you. Get ready for some personalized burns! 🔥',
        [{ text: 'Let\'s Roast!', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error) {
      console.error('Error saving personalization:', error);
      Alert.alert('Error', 'Failed to save your preferences. You can try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    const currentAnswer = answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case 'single':
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  currentAnswer === option && styles.optionButtonSelected
                ]}
                onPress={() => handleAnswer(option)}
              >
                <Text style={[
                  styles.optionText,
                  currentAnswer === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
                {currentAnswer === option && (
                  <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'multiple':
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option, index) => {
              const isSelected = Array.isArray(currentAnswer) && currentAnswer.includes(option);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected
                  ]}
                  onPress={() => {
                    const currentSelections = Array.isArray(currentAnswer) ? currentAnswer : [];
                    const newSelections = isSelected
                      ? currentSelections.filter(item => item !== option)
                      : [...currentSelections, option];
                    handleAnswer(newSelections);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'text':
        return (
          <View style={styles.textInputContainer}>
            <Text style={styles.textInputLabel}>
              {currentQuestion.placeholder}
            </Text>
            <Text style={styles.textInputValue}>
              {currentAnswer || 'No additional info provided'}
            </Text>
            <TouchableOpacity
              style={styles.textInputButton}
              onPress={() => {
                // For now, we'll just show a placeholder
                // In a real app, you'd open a text input modal
                Alert.alert(
                  'Text Input',
                  'In a full implementation, this would open a text input field. For now, we\'ll skip this question.',
                  [{ text: 'OK', onPress: () => handleAnswer('') }]
                );
              }}
            >
              <Text style={styles.textInputButtonText}>Add Text</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make It Personal</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} 
          />
        </View>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
        </Text>
      </View>

      {/* Question */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
          {!currentQuestion.required && (
            <Text style={styles.optionalText}>Optional</Text>
          )}
        </View>

        {renderQuestion()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {!isFirstQuestion && (
          <TouchableOpacity onPress={handlePrevious} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color="#4ECDC4" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.navSpacer} />
        
        {isLastQuestion ? (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Saving...' : 'Complete Setup'}
            </Text>
            <Ionicons name="checkmark" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNext} style={styles.navButton}>
            <Text style={styles.navButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={24} color="#4ECDC4" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 50,
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    lineHeight: 32,
  },
  optionalText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#2a2a2a',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  optionTextSelected: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  textInputContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  textInputLabel: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  textInputValue: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  textInputButton: {
    backgroundColor: '#4ECDC4',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  textInputButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  navButtonText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  navSpacer: {
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 