/**
 * Gemini API Service for AI Chatbot Integration
 * Handles conversation management and exercise-related queries
 */

import { GoogleGenAI } from '@google/genai';
import { ExerciseService } from './exerciseService';
import { ExerciseRecommendationService } from './exerciseRecommendationService';
import { Exercise, ExerciseSearchFilters } from '../types/exercise';
import { UserProfile } from '../types/auth';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'exercise_info' | 'exercise_recommendation' | 'form_guidance';
  metadata?: {
    exercises?: Exercise[];
    confidence?: number;
    sources?: string[];
    actions?: ChatAction[];
  };
}

export interface ChatAction {
  type: 'view_exercise' | 'start_workout' | 'search_exercises' | 'get_alternatives';
  label: string;
  data: any;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  messageHistory: ChatMessage[];
  userProfile?: {
    fitnessLevel: string;
    availableEquipment: string[];
    fitnessGoals: string[];
  };
  currentTopic?: 'exercise' | 'nutrition' | 'form' | 'general';
  lastExerciseQuery?: string;
}

export interface ExerciseQuery {
  exerciseName?: string;
  muscleGroup?: string;
  equipment?: string;
  difficulty?: string;
  queryType: 'info' | 'alternatives' | 'form_guidance';
}

class GeminiService {
  private genAI: GoogleGenAI | null = null;
  private conversations: Map<string, ConversationContext> = new Map();

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log('Gemini API Key check:', apiKey ? 'Found' : 'Not found', apiKey?.substring(0, 10) + '...');
    if (apiKey && apiKey !== 'your_gemini_api_key') {
      this.genAI = new GoogleGenAI({ apiKey });
      console.log('Gemini AI initialized successfully');
    } else {
      console.warn('Gemini API key not found or is placeholder. Chatbot will use fallback responses.');
    }
  }

  /**
   * Initialize a new conversation context
   */
  initializeConversation(userId: string, userProfile?: ConversationContext['userProfile']): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const context: ConversationContext = {
      userId,
      sessionId,
      messageHistory: [],
      userProfile,
    };

    this.conversations.set(sessionId, context);
    return sessionId;
  }

  /**
   * Process user message and generate AI response with enhanced error handling
   */
  async processMessage(sessionId: string, userMessage: string): Promise<ChatMessage> {
    const context = this.conversations.get(sessionId);
    if (!context) {
      throw new Error('Conversation context not found');
    }

    // Add user message to history
    const userChatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      type: 'text',
    };

    context.messageHistory.push(userChatMessage);

    try {
      // Determine query type and extract exercise information
      const queryAnalysis = await this.analyzeQuery(userMessage, context);
      
      // Get relevant exercise data if needed
      const exerciseData = await this.getRelevantExerciseData(queryAnalysis, context);
      
      // Handle empty search results with alternatives
      if (queryAnalysis.type !== 'text' && exerciseData.exercises.length === 0) {
        return await this.handleEmptyResults(userMessage, context, queryAnalysis);
      }
      
      // Generate AI response with exercise context
      const response = await this.generateResponse(userMessage, context, queryAnalysis, exerciseData);

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        type: queryAnalysis.type,
        metadata: {
          exercises: exerciseData.exercises,
          confidence: response.confidence,
          actions: response.actions,
        },
      };

      context.messageHistory.push(assistantMessage);
      context.currentTopic = queryAnalysis.topic;
      context.lastExerciseQuery = queryAnalysis.type !== 'text' ? userMessage : context.lastExerciseQuery;
      
      this.conversations.set(sessionId, context);

      return assistantMessage;
    } catch (error) {
      console.error('Error processing message:', error);
      return this.generateFallbackResponse(userMessage, context);
    }
  }

  /**
   * Analyze user query to determine intent and extract exercise information
   */
  private async analyzeQuery(message: string, context: ConversationContext): Promise<{
    type: ChatMessage['type'];
    topic: ConversationContext['currentTopic'];
    exerciseNames: string[];
    muscleGroups: string[];
    equipment: string[];
    intent: string;
  }> {
    const lowerMessage = message.toLowerCase();
    
    // Extract exercise names, muscle groups, equipment from message
    const exerciseNames = this.extractExerciseNames(message);
    const muscleGroups = this.extractMuscleGroups(message);
    const equipment = this.extractEquipment(message);
    
    let type: ChatMessage['type'] = 'text';
    let topic: ConversationContext['currentTopic'] = 'general';
    let intent = 'general_question';

    // Determine query type based on keywords and context
    if (lowerMessage.includes('form') || lowerMessage.includes('technique') || 
        lowerMessage.includes('how to') || lowerMessage.includes('proper way')) {
      type = 'form_guidance';
      topic = 'form';
      intent = 'form_guidance';
    } else if (lowerMessage.includes('alternative') || lowerMessage.includes('replace') || 
               lowerMessage.includes('instead') || lowerMessage.includes('substitute')) {
      type = 'exercise_recommendation';
      topic = 'exercise';
      intent = 'find_alternatives';
    } else if (exerciseNames.length > 0 || muscleGroups.length > 0 || 
               lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
      type = 'exercise_info';
      topic = 'exercise';
      intent = 'exercise_information';
    }

    return {
      type,
      topic,
      exerciseNames,
      muscleGroups,
      equipment,
      intent,
    };
  }

  /**
   * Get relevant exercise data based on query analysis
   */
  private async getRelevantExerciseData(
    queryAnalysis: any,
    context: ConversationContext
  ): Promise<{
    exercises: Exercise[];
    searchResults?: any;
    recommendations?: any;
  }> {
    const exercises: Exercise[] = [];
    let searchResults = null;
    let recommendations = null;

    try {
      if (queryAnalysis.type === 'exercise_info') {
        // Search for specific exercises or by criteria
        if (queryAnalysis.exerciseNames.length > 0) {
          // Search by exercise names
          for (const exerciseName of queryAnalysis.exerciseNames) {
            const searchResult = await ExerciseService.searchExercises(exerciseName, {}, 5);
            exercises.push(...searchResult.exercises);
          }
        } else if (queryAnalysis.muscleGroups.length > 0 || queryAnalysis.equipment.length > 0) {
          // Search by muscle groups or equipment
          const filters: ExerciseSearchFilters = {};
          if (queryAnalysis.muscleGroups.length > 0) {
            filters.targetMuscles = queryAnalysis.muscleGroups as any;
          }
          if (queryAnalysis.equipment.length > 0) {
            filters.equipment = queryAnalysis.equipment as any;
          }
          
          searchResults = await ExerciseService.searchExercises('', filters, 8);
          exercises.push(...searchResults.exercises);
        }
      } else if (queryAnalysis.type === 'exercise_recommendation' && context.userProfile) {
        // Get exercise recommendations
        const userProfile = this.buildUserProfileForRecommendations(context.userProfile);
        if (context.lastExerciseQuery) {
          recommendations = await ExerciseRecommendationService.getAlternativeSuggestions(
            context.lastExerciseQuery,
            userProfile,
            6
          );
          exercises.push(...recommendations.map((r: any) => r.exercise));
        } else {
          recommendations = await ExerciseRecommendationService.getPersonalizedRecommendations(
            userProfile,
            {},
            6
          );
          exercises.push(...recommendations.map((r: any) => r.exercise));
        }
      }
    } catch (error) {
      console.error('Error fetching exercise data:', error);
    }

    return {
      exercises: this.removeDuplicateExercises(exercises),
      searchResults,
      recommendations,
    };
  }

  /**
   * Generate AI response using Gemini API
   */
  private async generateResponse(
    userMessage: string,
    context: ConversationContext,
    queryAnalysis: any,
    exerciseData: any
  ): Promise<{
    content: string;
    confidence: number;
    actions: ChatAction[];
  }> {
    if (!this.genAI) {
      return {
        content: this.generateLocalResponse(userMessage, queryAnalysis.type, exerciseData),
        confidence: 0.5,
        actions: this.generateActions(queryAnalysis, exerciseData),
      };
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context, queryAnalysis, exerciseData);
      const prompt = `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`;

      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return {
        content: response.text || this.generateLocalResponse(userMessage, queryAnalysis.type, exerciseData),
        confidence: 0.8,
        actions: this.generateActions(queryAnalysis, exerciseData),
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        content: this.generateLocalResponse(userMessage, queryAnalysis.type, exerciseData),
        confidence: 0.3,
        actions: this.generateActions(queryAnalysis, exerciseData),
      };
    }
  }

  /**
   * Build system prompt based on context and query type
   */
  private buildSystemPrompt(
    context: ConversationContext,
    queryAnalysis: any,
    exerciseData: any
  ): string {
    const basePrompt = `You are a knowledgeable fitness assistant helping users with exercise guidance. 
You provide accurate, helpful, and encouraging responses about fitness, exercises, and workout routines.
Always prioritize safety and proper form in your recommendations.`;

    const userContext = context.userProfile ? `
User Profile:
- Fitness Level: ${context.userProfile.fitnessLevel}
- Available Equipment: ${context.userProfile.availableEquipment.join(', ')}
- Fitness Goals: ${context.userProfile.fitnessGoals.join(', ')}` : '';

    let exerciseContext = '';
    if (exerciseData.exercises && exerciseData.exercises.length > 0) {
      exerciseContext = `\nRelevant Exercises Found:\n`;
      exerciseData.exercises.slice(0, 5).forEach((exercise: Exercise, index: number) => {
        exerciseContext += `${index + 1}. ${exercise.name}
   - Category: ${exercise.category}
   - Difficulty: ${exercise.difficulty}
   - Target Muscles: ${exercise.targetMuscles.join(', ')}
   - Equipment: ${exercise.equipment.join(', ')}
   - Instructions: ${exercise.instructions.slice(0, 2).join(' ')}
   
`;
      });
    }

    const typeSpecificPrompt = {
      exercise_info: `Focus on providing detailed exercise information. Use the exercise data provided to give accurate information about targeted muscle groups, difficulty levels, proper form, and benefits. If multiple exercises are relevant, compare them briefly.`,
      exercise_recommendation: `Suggest suitable exercise alternatives based on the user's equipment and fitness level. Use the exercise data and recommendations provided. Explain why each alternative is suitable and how it compares to what the user was looking for.`,
      form_guidance: `Provide step-by-step form instructions and highlight common mistakes to avoid. Use the exercise data to give specific guidance. Include safety tips and modifications for different fitness levels.`,
      text: `Provide helpful fitness guidance and answer general questions about exercise and health. Use any relevant exercise data to support your response.`,
    };

    return `${basePrompt}${userContext}${exerciseContext}

${typeSpecificPrompt[queryAnalysis.type || 'text']}

Keep responses concise but informative (2-3 paragraphs max), use a friendly and encouraging tone, and always prioritize safety. If you mention specific exercises, reference the ones from the exercise data when possible.`;
  }

  /**
   * Generate local fallback responses when API is unavailable
   */
  private generateLocalResponse(
    userMessage: string,
    queryType: ChatMessage['type'],
    exerciseData?: any
  ): string {
    const lowerMessage = userMessage.toLowerCase();

    // If we have exercise data, use it to provide better responses
    if (exerciseData?.exercises && exerciseData.exercises.length > 0) {
      const exercises = exerciseData.exercises.slice(0, 3);
      
      if (queryType === 'exercise_info') {
        const exerciseList = exercises.map((ex: Exercise) => 
          `• **${ex.name}** (${ex.difficulty}) - Targets: ${ex.targetMuscles.join(', ')}`
        ).join('\n');
        
        return `I found these exercises that match your query:\n\n${exerciseList}\n\nWhile my AI is currently offline, you can find detailed instructions and safety tips for each exercise in our exercise database. Each exercise includes step-by-step guidance and form tips.`;
      }
      
      if (queryType === 'exercise_recommendation') {
        const exerciseList = exercises.map((ex: Exercise) => 
          `• **${ex.name}** - Great for ${ex.targetMuscles.join(', ')}, uses ${ex.equipment.join(', ')}`
        ).join('\n');
        
        return `Here are some great alternatives I found:\n\n${exerciseList}\n\nThese exercises match your fitness level and available equipment. Check out the detailed instructions in our exercise database for proper form and safety tips.`;
      }
      
      if (queryType === 'form_guidance') {
        const exercise = exercises[0];
        return `For proper form with **${exercise.name}**:\n\n${exercise.instructions.slice(0, 3).join('\n')}\n\nWhile I'm in offline mode, you can find complete form guidance and common mistakes to avoid in our exercise database. For real-time form analysis, try our AI-powered pose detection feature.`;
      }
    }

    const responses = {
      exercise_info: [
        "I'd be happy to help you learn about exercises! While I'm currently in offline mode, I can tell you that most exercises target specific muscle groups and have varying difficulty levels. For detailed exercise information, you can browse our exercise database.",
        "Great question about exercises! In offline mode, I recommend checking our comprehensive exercise library where you'll find detailed descriptions, muscle group targets, and difficulty ratings for hundreds of exercises.",
      ],
      exercise_recommendation: [
        "I'd love to suggest exercise alternatives! While my AI is currently offline, you can find great alternatives by browsing exercises that target the same muscle groups in our exercise database. Filter by your available equipment for the best matches.",
        "For exercise alternatives, try searching our exercise library by muscle group or equipment type. This will help you find suitable replacements that match your fitness level and available equipment.",
      ],
      form_guidance: [
        "Proper form is crucial for effective and safe workouts! While I'm in offline mode, I recommend checking the detailed instructions and safety tips available for each exercise in our database. You can also use our AI form correction feature with your camera for real-time feedback.",
        "Form guidance is so important! Each exercise in our database includes step-by-step instructions and common mistakes to avoid. For real-time form analysis, try our AI-powered pose detection feature.",
      ],
      text: [
        "I'm here to help with your fitness journey! While my AI is currently in offline mode, you can explore our exercise database, create workout routines, track your progress, and use our AI form correction features.",
        "Thanks for reaching out! I'm currently in offline mode, but you have access to our full exercise library, workout tracking, diet planning, and real-time form correction features. How can I direct you to the right tool?",
      ],
    };

    const typeResponses = responses[queryType || 'text'];
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  }

  /**
   * Handle empty search results by providing alternatives and suggestions
   */
  private async handleEmptyResults(
    userMessage: string,
    context: ConversationContext,
    queryAnalysis: any
  ): Promise<ChatMessage> {
    try {
      // Try to get alternative suggestions based on broader criteria
      const alternatives = await this.getAlternativeSuggestions(userMessage, context);
      
      let content = "I couldn't find exact matches for your query, but here are some alternatives that might help:\n\n";
      
      if (alternatives.exercises.length > 0) {
        content += alternatives.exercises.slice(0, 3).map((exercise: Exercise, index: number) => 
          `${index + 1}. **${exercise.name}** - ${exercise.targetMuscles.join(', ')}`
        ).join('\n');
        
        content += "\n\nThese exercises target similar muscle groups or use similar equipment.";
      } else {
        content = this.generateHelpfulSuggestions(userMessage, queryAnalysis);
      }

      return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        type: 'exercise_recommendation',
        metadata: {
          exercises: alternatives.exercises,
          confidence: 0.6,
          actions: [
            {
              type: 'search_exercises',
              label: 'Browse Exercise Library',
              data: { query: userMessage },
            },
            {
              type: 'get_alternatives',
              label: 'More Suggestions',
              data: { query: userMessage },
            },
          ],
        },
      };
    } catch (error) {
      console.error('Error handling empty results:', error);
      return this.generateFallbackResponse(userMessage, context);
    }
  }

  /**
   * Get alternative exercise suggestions when primary search fails
   */
  private async getAlternativeSuggestions(
    userMessage: string,
    context: ConversationContext
  ): Promise<{ exercises: Exercise[] }> {
    const exercises: Exercise[] = [];

    try {
      if (context.userProfile) {
        const userProfile = this.buildUserProfileForRecommendations(context.userProfile);
        
        // Try getting general recommendations based on user profile
        const recommendations = await ExerciseRecommendationService.getPersonalizedRecommendations(
          userProfile,
          {},
          6
        );
        
        exercises.push(...recommendations.map((r: any) => r.exercise));
      }

      // If still no results, get popular exercises
      if (exercises.length === 0) {
        const popularExercises = await ExerciseService.getPopularExercises(6);
        exercises.push(...popularExercises);
      }
    } catch (error) {
      console.error('Error getting alternative suggestions:', error);
    }

    return { exercises: this.removeDuplicateExercises(exercises) };
  }

  /**
   * Generate helpful suggestions when no exercises are found
   */
  private generateHelpfulSuggestions(userMessage: string, queryAnalysis: any): string {
    const lowerMessage = userMessage.toLowerCase();
    
    let suggestions = "I couldn't find specific exercises matching your request. Here are some suggestions:\n\n";
    
    // Provide context-specific suggestions
    if (lowerMessage.includes('equipment') || queryAnalysis.equipment.length > 0) {
      suggestions += "• Try searching for bodyweight exercises if you don't have equipment\n";
      suggestions += "• Browse exercises by equipment type in our exercise library\n";
      suggestions += "• Ask about alternatives: 'What can I do instead of [exercise]?'\n";
    } else if (queryAnalysis.muscleGroups.length > 0) {
      suggestions += "• Try broader muscle group terms (e.g., 'upper body' instead of specific muscles)\n";
      suggestions += "• Ask for beginner-friendly exercises for your target area\n";
      suggestions += "• Browse our exercise categories for inspiration\n";
    } else {
      suggestions += "• Try being more specific: 'Show me chest exercises with dumbbells'\n";
      suggestions += "• Ask about exercise categories: 'What are good strength exercises?'\n";
      suggestions += "• Request form guidance: 'How do I do a proper squat?'\n";
      suggestions += "• Ask for alternatives: 'What can I do instead of running?'\n";
    }
    
    suggestions += "\nYou can also browse our complete exercise library or ask me about specific fitness goals!";
    
    return suggestions;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): ChatMessage[] {
    const context = this.conversations.get(sessionId);
    return context?.messageHistory || [];
  }

  /**
   * Clear conversation history
   */
  clearConversation(sessionId: string): void {
    const context = this.conversations.get(sessionId);
    if (context) {
      context.messageHistory = [];
      this.conversations.set(sessionId, context);
    }
  }

  /**
   * End conversation and cleanup
   */
  endConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Extract exercise names from user message
   */
  private extractExerciseNames(message: string): string[] {
    const exerciseKeywords = [
      'push-up', 'pushup', 'squat', 'deadlift', 'bench press', 'pull-up', 'pullup',
      'plank', 'burpee', 'lunge', 'bicep curl', 'tricep dip', 'shoulder press',
      'lat pulldown', 'chest fly', 'leg press', 'calf raise', 'crunch', 'sit-up',
      'mountain climber', 'jumping jack', 'dumbbell row', 'barbell row'
    ];
    
    const lowerMessage = message.toLowerCase();
    return exerciseKeywords.filter(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Extract muscle groups from user message
   */
  private extractMuscleGroups(message: string): string[] {
    const muscleMap: Record<string, string> = {
      'chest': 'chest', 'pecs': 'chest', 'pectoral': 'chest',
      'back': 'back', 'lats': 'back', 'latissimus': 'back',
      'shoulder': 'shoulders', 'shoulders': 'shoulders', 'delts': 'shoulders',
      'bicep': 'biceps', 'biceps': 'biceps',
      'tricep': 'triceps', 'triceps': 'triceps',
      'abs': 'abs', 'abdominal': 'abs', 'core': 'core',
      'glutes': 'glutes', 'glute': 'glutes', 'butt': 'glutes',
      'quads': 'quadriceps', 'quadriceps': 'quadriceps', 'thighs': 'quadriceps',
      'hamstrings': 'hamstrings', 'hamstring': 'hamstrings',
      'calves': 'calves', 'calf': 'calves',
      'legs': 'quadriceps', 'arms': 'biceps',
    };

    const lowerMessage = message.toLowerCase();
    const foundMuscles: string[] = [];
    
    Object.entries(muscleMap).forEach(([key, value]) => {
      if (lowerMessage.includes(key) && !foundMuscles.includes(value)) {
        foundMuscles.push(value);
      }
    });
    
    return foundMuscles;
  }

  /**
   * Extract equipment from user message
   */
  private extractEquipment(message: string): string[] {
    const equipmentMap: Record<string, string> = {
      'dumbbell': 'dumbbells', 'dumbbells': 'dumbbells',
      'barbell': 'barbell', 'barbells': 'barbell',
      'kettlebell': 'kettlebell', 'kettlebells': 'kettlebell',
      'bodyweight': 'none', 'no equipment': 'none',
      'resistance band': 'resistance_bands', 'bands': 'resistance_bands',
      'pull up bar': 'pull_up_bar', 'pullup': 'pull_up_bar',
      'cable': 'cable_machine', 'machine': 'cable_machine',
    };

    const lowerMessage = message.toLowerCase();
    const foundEquipment: string[] = [];
    
    Object.entries(equipmentMap).forEach(([key, value]) => {
      if (lowerMessage.includes(key) && !foundEquipment.includes(value)) {
        foundEquipment.push(value);
      }
    });
    
    return foundEquipment;
  }

  /**
   * Build user profile for recommendations
   */
  private buildUserProfileForRecommendations(userProfile: ConversationContext['userProfile']): UserProfile {
    return {
      uid: 'temp',
      email: 'temp@example.com',
      displayName: 'User',
      personalMetrics: {
        height: 170,
        weight: 70,
        age: 30,
        gender: 'other',
        activityLevel: userProfile?.fitnessLevel || 'moderate',
        fitnessGoals: userProfile?.fitnessGoals || [],
      },
      preferences: {
        units: 'metric',
        theme: 'light',
        notifications: {
          workoutReminders: true,
          progressUpdates: true,
          socialUpdates: false,
          systemUpdates: true,
        },
        privacy: {
          profileVisibility: 'private',
          shareWorkouts: false,
          shareProgress: false,
          allowMessaging: false,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as UserProfile;
  }

  /**
   * Remove duplicate exercises from array
   */
  private removeDuplicateExercises(exercises: Exercise[]): Exercise[] {
    const seen = new Set<string>();
    return exercises.filter(exercise => {
      if (seen.has(exercise.id)) {
        return false;
      }
      seen.add(exercise.id);
      return true;
    });
  }

  /**
   * Generate action buttons for chat messages
   */
  private generateActions(queryAnalysis: any, exerciseData: any): ChatAction[] {
    const actions: ChatAction[] = [];

    if (exerciseData.exercises && exerciseData.exercises.length > 0) {
      const exercise = exerciseData.exercises[0];
      
      actions.push({
        type: 'view_exercise',
        label: `View ${exercise.name}`,
        data: { exerciseId: exercise.id },
      });

      if (queryAnalysis.type === 'exercise_recommendation') {
        actions.push({
          type: 'get_alternatives',
          label: 'More Alternatives',
          data: { query: queryAnalysis.intent },
        });
      }
    }

    if (queryAnalysis.type === 'exercise_info' || queryAnalysis.type === 'form_guidance') {
      actions.push({
        type: 'search_exercises',
        label: 'Browse Exercise Library',
        data: { filters: queryAnalysis },
      });
    }

    return actions;
  }

  /**
   * Generate fallback response for errors with context awareness
   */
  private generateFallbackResponse(userMessage: string, context?: ConversationContext): ChatMessage {
    let content = "I'm sorry, I'm having trouble processing your request right now.";
    
    // Provide context-specific fallback suggestions
    if (context?.currentTopic === 'exercise') {
      content += " You can browse our exercise database, search for specific exercises, or ask me about workout alternatives while I get back online!";
    } else if (context?.currentTopic === 'form') {
      content += " For form guidance, you can check the detailed instructions in our exercise database or use our AI form correction feature with your camera.";
    } else {
      content += " Please try again, or feel free to browse our exercise database and other features while I get back online!";
    }

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      type: 'text',
      metadata: {
        exercises: [],
        confidence: 0.1,
        actions: [
          {
            type: 'search_exercises',
            label: 'Browse Exercises',
            data: {},
          },
        ],
      },
    };
  }

  /**
   * Handle unclear queries by asking for clarification
   */
  private generateClarificationResponse(userMessage: string, context: ConversationContext): ChatMessage {
    const suggestions = [
      "Could you be more specific about what you're looking for?",
      "Are you looking for exercise information, form guidance, or workout alternatives?",
      "What muscle groups are you interested in targeting?",
      "Do you have any specific equipment available?",
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    const content = `I want to help you find the right exercises! ${randomSuggestion}\n\nHere are some examples of what you can ask:\n• "Show me chest exercises with dumbbells"\n• "How do I do a proper squat?"\n• "What are good alternatives to running?"\n• "Beginner exercises for back pain"`;

    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      type: 'text',
      metadata: {
        exercises: [],
        confidence: 0.7,
        actions: [
          {
            type: 'search_exercises',
            label: 'Browse All Exercises',
            data: {},
          },
        ],
      },
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();