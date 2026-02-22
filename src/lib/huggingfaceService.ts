/**
 * Hugging Face API Service for AI Chatbot Integration
 * Free AI service with no credit card required
 */

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

class HuggingFaceService {
  private readonly apiKey: string | null = null;
  private readonly conversations: Map<string, ConversationContext> = new Map();
  private readonly baseUrl = 'https://api-inference.huggingface.co/models';
  private readonly model = 'microsoft/DialoGPT-medium'; // Free conversational model

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
    console.log('Hugging Face API Key check:', apiKey ? 'Found' : 'Not found', apiKey?.substring(0, 10) + '...');
    if (apiKey && apiKey !== 'your_huggingface_api_key') {
      this.apiKey = apiKey;
      console.log('Hugging Face service initialized with enhanced local responses (API available for future backend integration)');
    } else {
      console.log('Hugging Face service initialized with enhanced local responses');
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
   * Generate AI response using Hugging Face API (with CORS handling)
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
    console.log('generateResponse called, Hugging Face available:', !!this.apiKey);
    
    // For now, always use local responses due to CORS restrictions
    // Hugging Face Inference API doesn't support direct browser calls
    console.log('Using enhanced local response with exercise data');
    
    return {
      content: this.generateEnhancedLocalResponse(userMessage, queryAnalysis.type, exerciseData, context),
      confidence: 0.8, // High confidence for our enhanced local responses
      actions: this.generateActions(queryAnalysis, exerciseData),
    };

    // Note: Direct Hugging Face API calls from browser are blocked by CORS
    // To use Hugging Face API, you would need a backend server to proxy the requests
    // For now, our enhanced local responses provide excellent fitness guidance
  }

  /**
   * Build prompt for Hugging Face model
   */
  private buildPrompt(
    userMessage: string,
    _context: ConversationContext,
    _queryAnalysis: QueryAnalysis,
    _exerciseData: ExerciseData
  ): string {
    let prompt = "You are a helpful fitness assistant. ";

    // Add user context
    if (_context.userProfile) {
      prompt += `User is ${_context.userProfile.fitnessLevel} level. `;
    }

    // Add exercise context
    if (_exerciseData.exercises && _exerciseData.exercises.length > 0) {
      const exerciseNames = _exerciseData.exercises.slice(0, 3).map((ex: Exercise) => ex.name).join(', ');
      prompt += `Relevant exercises: ${exerciseNames}. `;
    }

    // Add conversation history (last 2 messages for context)
    const recentMessages = _context.messageHistory.slice(-4);
    for (const msg of recentMessages) {
      prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content} `;
    }

    prompt += `User: ${userMessage} Assistant:`;
    
    return prompt;
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
   * Generate enhanced local responses using exercise database and context
   */
  private generateEnhancedLocalResponse(
    userMessage: string,
    queryType: ChatMessage['type'],
    exerciseData?: ExerciseData,
    _context?: ConversationContext
  ): string {
    const lowerMessage = userMessage.toLowerCase();

    // If we have exercise data, provide detailed responses
    if (exerciseData?.exercises && exerciseData.exercises.length > 0) {
      const exercises = exerciseData.exercises.slice(0, 3);
      
      if (queryType === 'exercise_info') {
        const exerciseList = exercises.map((ex: Exercise) => {
          const equipment = ex.equipment.length > 0 ? ex.equipment.join(', ') : 'No equipment needed';
          const muscles = ex.targetMuscles.join(', ');
          return `**${ex.name}** (${ex.difficulty})\n• Targets: ${muscles}\n• Equipment: ${equipment}\n• ${ex.instructions[0] || 'Great exercise for building strength'}`;
        }).join('\n\n');
        
        return `Here are the exercises I found for you:\n\n${exerciseList}\n\n💡 **Pro tip**: Start with proper form over speed, and gradually increase intensity as you get stronger!`;
      }
      
      if (queryType === 'exercise_recommendation') {
        const exerciseList = exercises.map((ex: Exercise, index: number) => {
          const reasons = [];
          if (_context?.userProfile?.fitnessLevel === 'beginner' && ex.difficulty === 'beginner') {
            reasons.push('perfect for beginners');
          }
          if (ex.equipment.includes('none') || ex.equipment.includes('bodyweight' as Exercise['equipment'][0])) {
            reasons.push('no equipment needed');
          }
          if (ex.targetMuscles.length > 1) {
            reasons.push('works multiple muscles');
          }
          
          const reasonText = reasons.length > 0 ? ` - ${reasons.join(', ')}` : '';
          return `${index + 1}. **${ex.name}**${reasonText}\n   Targets: ${ex.targetMuscles.join(', ')}`;
        }).join('\n\n');
        
        return `Great alternatives for you:\n\n${exerciseList}\n\n🎯 These exercises match your fitness level and available equipment. Try our pose detection camera for real-time form feedback!`;
      }
      
      if (queryType === 'form_guidance') {
        const exercise = exercises[0];
        const instructions = exercise.instructions.slice(0, 4).map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n');
        
        return `**Perfect form for ${exercise.name}:**\n\n${instructions}\n\n⚠️ **Safety first**: Start with lighter weights or easier variations, focus on controlled movements, and stop if you feel pain.\n\n📹 Try our AI pose detection camera for real-time form analysis!`;
      }
    }

    // Context-aware responses based on user profile and message content
    if (_context?.userProfile?.fitnessLevel === 'beginner' && (lowerMessage.includes('start') || lowerMessage.includes('begin'))) {
      return `Welcome to your fitness journey! 🌟 As a beginner, I recommend starting with:\n\n• **Bodyweight exercises** - Build foundation strength\n• **Proper form focus** - Quality over quantity\n• **Gradual progression** - Increase intensity slowly\n• **Rest days** - Recovery is crucial\n\nTry our beginner-friendly exercises in the exercise library, and use our pose detection camera to ensure perfect form!`;
    }

    // Specific fitness topics
    if (lowerMessage.includes('lose weight') || lowerMessage.includes('fat loss') || lowerMessage.includes('burn calories')) {
      return `For effective weight loss, combine these strategies:\n\n🔥 **Cardio exercises**: Jumping jacks, burpees, mountain climbers\n💪 **Strength training**: Builds muscle, increases metabolism\n🍎 **Nutrition**: Create a moderate calorie deficit\n⏰ **Consistency**: Aim for 150+ minutes of activity weekly\n\nCheck our exercise library for calorie-burning workouts, and try our diet planning features!`;
    }

    if (lowerMessage.includes('muscle') || lowerMessage.includes('strength') || lowerMessage.includes('build')) {
      return `Building muscle requires the right approach:\n\n💪 **Progressive overload**: Gradually increase weight/reps\n🎯 **Compound exercises**: Squats, deadlifts, push-ups work multiple muscles\n🍗 **Protein intake**: Support muscle recovery and growth\n😴 **Rest**: Muscles grow during recovery, not just workouts\n\nExplore our strength training exercises and use our form analysis camera for optimal results!`;
    }

    if (lowerMessage.includes('back pain') || lowerMessage.includes('posture')) {
      return `For back health and posture improvement:\n\n🧘 **Stretching**: Cat-cow, child's pose, hip flexor stretches\n💪 **Core strengthening**: Planks, bird dogs, dead bugs\n🚶 **Movement**: Take breaks from sitting, walk regularly\n⚖️ **Balance**: Strengthen both front and back muscles\n\n⚠️ **Important**: Consult a healthcare provider for persistent pain. Our pose detection can help monitor your form during exercises!`;
    }

    if (lowerMessage.includes('home') || lowerMessage.includes('no equipment') || lowerMessage.includes('bodyweight')) {
      return `Excellent home workouts with no equipment needed:\n\n🏠 **Upper body**: Push-ups, tricep dips, pike push-ups\n🦵 **Lower body**: Squats, lunges, single-leg glute bridges\n🔥 **Cardio**: Jumping jacks, burpees, high knees\n💪 **Core**: Planks, mountain climbers, bicycle crunches\n\nFilter our exercise library by 'bodyweight' or 'none' equipment to find hundreds of home workout options!`;
    }

    if (lowerMessage.includes('time') || lowerMessage.includes('quick') || lowerMessage.includes('busy')) {
      return `Short on time? Try these efficient workouts:\n\n⚡ **HIIT workouts**: 15-20 minutes of high-intensity intervals\n🔄 **Circuit training**: Combine strength and cardio\n💪 **Compound exercises**: Work multiple muscles simultaneously\n🌅 **Morning routine**: 10-minute energizing workout\n\nEven 10-15 minutes of focused exercise can make a difference. Quality over quantity!`;
    }

    // Motivational and general fitness responses
    const motivationalResponses = [
      `I'm here to support your fitness journey! 💪 Whether you're looking for exercise guidance, form tips, or workout alternatives, I've got you covered.\n\n🎯 **What I can help with**:\n• Exercise recommendations based on your goals\n• Proper form and technique guidance\n• Workout alternatives for any situation\n• Beginner-friendly routines\n\nTry asking: "Show me beginner chest exercises" or "How do I do a proper squat?"`,
      
      `Great to see you focusing on fitness! 🌟 I'm powered by a comprehensive exercise database with hundreds of exercises.\n\n💡 **Pro tips**:\n• Start with bodyweight exercises if you're new\n• Focus on form before adding weight\n• Consistency beats perfection\n• Listen to your body and rest when needed\n\nWhat specific area would you like to work on today?`,
      
      `Fitness is a journey, not a destination! 🚀 I'm here to guide you every step of the way.\n\n🔍 **Try these searches**:\n• "Core exercises for beginners"\n• "Upper body workout with dumbbells"\n• "How to improve squat form"\n• "Alternatives to running"\n\nOur pose detection camera can also provide real-time form feedback!`
    ];

    return motivationalResponses[Math.floor(Math.random() * motivationalResponses.length)];
  }

  // Helper methods (same as other services)
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

  private generateFallbackResponse(_userMessage: string, _context?: ConversationContext): ChatMessage {
    let content = "I'm here to help with your fitness journey!";
    
    if (_context?.currentTopic === 'exercise') {
      content += " You can browse our exercise database, search for specific exercises, or ask me about workout alternatives.";
    } else if (_context?.currentTopic === 'form') {
      content += " For form guidance, check our exercise database or use our AI pose detection camera for real-time feedback.";
    } else {
      content += " Ask me about exercises, proper form, workout routines, or use our pose detection camera for real-time feedback!";
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
export const huggingfaceService = new HuggingFaceService();