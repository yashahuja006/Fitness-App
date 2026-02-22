/**
 * OpenAI API Service for AI Chatbot Integration
 * Handles conversation management and exercise-related queries
 */

import OpenAI from 'openai';
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
  data: Record<string, unknown>;
}

interface QueryAnalysis {
  type: ChatMessage['type'];
  topic: ConversationContext['currentTopic'];
  exerciseNames: string[];
  muscleGroups: string[];
  equipment: string[];
  intent: string;
}

interface ExerciseData {
  exercises: Exercise[];
  searchResults?: unknown;
  recommendations?: unknown;
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

class OpenAIService {
  private readonly openai: OpenAI | null = null;
  private readonly conversations: Map<string, ConversationContext> = new Map();

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    console.log('OpenAI API Key check:', apiKey ? 'Found' : 'Not found', apiKey?.substring(0, 15) + '...');
    if (apiKey?.startsWith('sk-')) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
      });
      console.log('OpenAI initialized successfully');
    } else {
      console.warn('OpenAI API key not found or invalid. Chatbot will use fallback responses.');
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
   * Process user message and generate AI response
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
      context.lastExerciseQuery = queryAnalysis.type === 'text' ? context.lastExerciseQuery : userMessage;
      
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
  private async analyzeQuery(message: string, _context: ConversationContext): Promise<QueryAnalysis> {
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
    queryAnalysis: QueryAnalysis,
    context: ConversationContext
  ): Promise<ExerciseData> {
    const exercises: Exercise[] = [];
    let searchResults: unknown = null;
    let recommendations: unknown = null;

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
            filters.targetMuscles = queryAnalysis.muscleGroups as Exercise['targetMuscles'];
          }
          if (queryAnalysis.equipment.length > 0) {
            filters.equipment = queryAnalysis.equipment as Exercise['equipment'];
          }
          
          searchResults = await ExerciseService.searchExercises('', filters, 8);
          exercises.push(...(searchResults as { exercises: Exercise[] }).exercises);
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
          exercises.push(...(recommendations as { exercise: Exercise }[]).map(r => r.exercise));
        } else {
          recommendations = await ExerciseRecommendationService.getPersonalizedRecommendations(
            userProfile,
            {},
            6
          );
          exercises.push(...(recommendations as { exercise: Exercise }[]).map(r => r.exercise));
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
   * Generate AI response using OpenAI API
   */
  private async generateResponse(
    userMessage: string,
    context: ConversationContext,
    queryAnalysis: QueryAnalysis,
    exerciseData: ExerciseData
  ): Promise<{
    content: string;
    confidence: number;
    actions: ChatAction[];
  }> {
    console.log('generateResponse called, OpenAI available:', !!this.openai);
    
    if (!this.openai) {
      console.log('No OpenAI instance, using local response');
      return {
        content: this.generateLocalResponse(userMessage, queryAnalysis.type, exerciseData),
        confidence: 0.5,
        actions: this.generateActions(queryAnalysis, exerciseData),
      };
    }

    try {
      console.log('Attempting OpenAI API call...');
      
      const systemPrompt = this.buildSystemPrompt(context, queryAnalysis, exerciseData);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      console.log('OpenAI API success, response length:', responseText.length);

      return {
        content: responseText || this.generateLocalResponse(userMessage, queryAnalysis.type, exerciseData),
        confidence: 0.9,
        actions: this.generateActions(queryAnalysis, exerciseData),
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
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
    queryAnalysis: QueryAnalysis,
    exerciseData: ExerciseData
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
    exerciseData?: ExerciseData
  ): string {
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

    const responses: Record<'exercise_info' | 'exercise_recommendation' | 'form_guidance' | 'text', string[]> = {
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

    let typeResponses: string[];
    if (queryType === 'exercise_info') {
      typeResponses = responses.exercise_info;
    } else if (queryType === 'exercise_recommendation') {
      typeResponses = responses.exercise_recommendation;
    } else if (queryType === 'form_guidance') {
      typeResponses = responses.form_guidance;
    } else {
      typeResponses = responses.text;
    }
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  }

  // Helper methods (same as Gemini service)
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

  private generateActions(queryAnalysis: QueryAnalysis, exerciseData: ExerciseData): ChatAction[] {
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

  private generateFallbackResponse(userMessage: string, context?: ConversationContext): ChatMessage {
    let content = "I'm sorry, I'm having trouble processing your request right now.";
    
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
}

// Export singleton instance
export const openaiService = new OpenAIService();