import { ExerciseRecommendationService } from '@/lib/exerciseRecommendationService';
import { Exercise, DifficultyLevel, Equipment, MuscleGroup } from '@/types/exercise';
import { UserProfile } from '@/types/auth';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

describe('ExerciseRecommendationService', () => {
  const mockUserProfile: UserProfile = {
    uid: 'test-user',
    email: 'test@example.com',
    displayName: 'Test User',
    personalMetrics: {
      height: 175,
      weight: 70,
      age: 30,
      gender: 'male',
      activityLevel: 'moderate',
      fitnessGoals: ['strength', 'muscle gain'],
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
        shareProgress: false,
        shareWorkouts: false,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockExercises: Exercise[] = [
    {
      id: 'push-up',
      name: 'Push-up',
      category: 'strength',
      targetMuscles: ['chest', 'triceps'],
      equipment: ['none'],
      difficulty: 'beginner',
      instructions: ['Start in plank position', 'Lower body to ground', 'Push back up'],
      commonMistakes: ['Sagging hips'],
      safetyTips: ['Keep core engaged'],
      mediaAssets: { images: [], videos: [], demonstrations: [] },
      metadata: {
        createdBy: 'system',
        verified: true,
        popularity: 100,
        tags: ['bodyweight', 'upper body'],
        averageRating: 4.5,
      },
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    },
    {
      id: 'squat',
      name: 'Squat',
      category: 'strength',
      targetMuscles: ['quadriceps', 'glutes'],
      equipment: ['none'],
      difficulty: 'beginner',
      instructions: ['Stand with feet shoulder-width apart', 'Lower into squat', 'Return to standing'],
      commonMistakes: ['Knees caving in'],
      safetyTips: ['Keep chest up'],
      mediaAssets: { images: [], videos: [], demonstrations: [] },
      metadata: {
        createdBy: 'system',
        verified: true,
        popularity: 95,
        tags: ['bodyweight', 'lower body'],
        averageRating: 4.3,
      },
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Activity Level to Difficulty Mapping', () => {
    test('should map sedentary activity level to beginner difficulty', () => {
      const userProfile = {
        ...mockUserProfile,
        personalMetrics: {
          ...mockUserProfile.personalMetrics,
          activityLevel: 'sedentary' as const,
        },
      };

      // Access private method through any casting for testing
      const difficulty = (ExerciseRecommendationService as any).mapActivityLevelToDifficulty(
        userProfile.personalMetrics.activityLevel
      );

      expect(difficulty).toBe('beginner');
    });

    test('should map moderate activity level to intermediate difficulty', () => {
      const difficulty = (ExerciseRecommendationService as any).mapActivityLevelToDifficulty('moderate');
      expect(difficulty).toBe('intermediate');
    });

    test('should map very_active activity level to advanced difficulty', () => {
      const difficulty = (ExerciseRecommendationService as any).mapActivityLevelToDifficulty('very_active');
      expect(difficulty).toBe('advanced');
    });
  });

  describe('Search Intent Extraction', () => {
    test('should extract muscle groups from search term', () => {
      const intent = (ExerciseRecommendationService as any).extractSearchIntent('chest workout');
      
      expect(intent.muscleGroups).toContain('chest');
      expect(intent.muscleGroups.length).toBeGreaterThan(0);
    });

    test('should extract equipment from search term', () => {
      const intent = (ExerciseRecommendationService as any).extractSearchIntent('dumbbell exercises');
      
      expect(intent.equipment).toContain('dumbbells');
    });

    test('should handle multiple keywords in search term', () => {
      const intent = (ExerciseRecommendationService as any).extractSearchIntent('chest dumbbell workout');
      
      expect(intent.muscleGroups).toContain('chest');
      expect(intent.equipment).toContain('dumbbells');
    });

    test('should return empty arrays for unrecognized terms', () => {
      const intent = (ExerciseRecommendationService as any).extractSearchIntent('xyz unknown term');
      
      expect(intent.muscleGroups).toEqual([]);
      expect(intent.equipment).toEqual([]);
      expect(intent.category).toBeNull();
    });
  });

  describe('Muscle Group Matching', () => {
    test('should calculate perfect match for identical muscle groups', () => {
      const exercise = mockExercises[0]; // Push-up targets chest, triceps
      const targetMuscles: MuscleGroup[] = ['chest', 'triceps'];
      
      const match = (ExerciseRecommendationService as any).calculateMuscleGroupMatch(exercise, targetMuscles);
      
      expect(match).toBe(1); // Perfect match
    });

    test('should calculate partial match for overlapping muscle groups', () => {
      const exercise = mockExercises[0]; // Push-up targets chest, triceps
      const targetMuscles: MuscleGroup[] = ['chest', 'biceps']; // Only chest matches
      
      const match = (ExerciseRecommendationService as any).calculateMuscleGroupMatch(exercise, targetMuscles);
      
      expect(match).toBe(0.5); // 1 out of 2 matches
    });

    test('should return 0 for no matching muscle groups', () => {
      const exercise = mockExercises[0]; // Push-up targets chest, triceps
      const targetMuscles: MuscleGroup[] = ['quadriceps', 'hamstrings'];
      
      const match = (ExerciseRecommendationService as any).calculateMuscleGroupMatch(exercise, targetMuscles);
      
      expect(match).toBe(0);
    });
  });

  describe('Equipment Matching', () => {
    test('should return 1 for bodyweight exercises regardless of available equipment', () => {
      const exercise = mockExercises[0]; // Push-up uses no equipment
      const availableEquipment: Equipment[] = ['dumbbells', 'barbell'];
      
      const match = (ExerciseRecommendationService as any).calculateEquipmentMatch(exercise, availableEquipment);
      
      expect(match).toBe(1);
    });

    test('should calculate perfect match when all required equipment is available', () => {
      const exercise = {
        ...mockExercises[0],
        equipment: ['dumbbells', 'bench'] as Equipment[],
      };
      const availableEquipment: Equipment[] = ['dumbbells', 'bench', 'barbell'];
      
      const match = (ExerciseRecommendationService as any).calculateEquipmentMatch(exercise, availableEquipment);
      
      expect(match).toBe(1);
    });

    test('should calculate partial match when some equipment is missing', () => {
      const exercise = {
        ...mockExercises[0],
        equipment: ['dumbbells', 'bench'] as Equipment[],
      };
      const availableEquipment: Equipment[] = ['dumbbells']; // Missing bench
      
      const match = (ExerciseRecommendationService as any).calculateEquipmentMatch(exercise, availableEquipment);
      
      expect(match).toBe(0.5); // 1 out of 2 equipment pieces available
    });
  });

  describe('Goal Matching', () => {
    test('should match strength goals with strength exercises', () => {
      const exercise = mockExercises[0]; // Strength category
      const goals = ['strength', 'muscle gain'];
      
      const match = (ExerciseRecommendationService as any).calculateGoalMatch(exercise, goals);
      
      expect(match).toBeGreaterThan(0);
    });

    test('should match cardio goals with high-calorie exercises', () => {
      const exercise = {
        ...mockExercises[0],
        category: 'cardio' as const,
        caloriesPerMinute: 10,
      };
      const goals = ['cardio', 'weight loss'];
      
      const match = (ExerciseRecommendationService as any).calculateGoalMatch(exercise, goals);
      
      expect(match).toBeGreaterThan(0);
    });

    test('should return 0 for unrelated goals', () => {
      const exercise = mockExercises[0]; // Strength exercise
      const goals = ['unrelated goal'];
      
      const match = (ExerciseRecommendationService as any).calculateGoalMatch(exercise, goals);
      
      expect(match).toBe(0);
    });
  });

  describe('Difficulty Appropriateness', () => {
    test('should allow beginner exercises for all user levels', () => {
      expect((ExerciseRecommendationService as any).isDifficultyAppropriate('beginner', 'beginner')).toBe(true);
      expect((ExerciseRecommendationService as any).isDifficultyAppropriate('beginner', 'intermediate')).toBe(true);
      expect((ExerciseRecommendationService as any).isDifficultyAppropriate('beginner', 'advanced')).toBe(true);
    });

    test('should not allow advanced exercises for beginner users', () => {
      expect((ExerciseRecommendationService as any).isDifficultyAppropriate('advanced', 'beginner')).toBe(false);
    });

    test('should allow intermediate exercises for intermediate and advanced users', () => {
      expect((ExerciseRecommendationService as any).isDifficultyAppropriate('intermediate', 'intermediate')).toBe(true);
      expect((ExerciseRecommendationService as any).isDifficultyAppropriate('intermediate', 'advanced')).toBe(true);
      expect((ExerciseRecommendationService as any).isDifficultyAppropriate('intermediate', 'beginner')).toBe(false);
    });
  });

  describe('Recommendation Reason Generation', () => {
    test('should generate appropriate reason for matched criteria', () => {
      const exercise = mockExercises[0];
      const matchedCriteria = ['target muscles', 'difficulty level'];
      const context = {
        userFitnessLevel: 'beginner' as DifficultyLevel,
        availableEquipment: ['none'] as Equipment[],
        targetMuscles: ['chest'] as MuscleGroup[],
        fitnessGoals: ['strength'],
      };
      
      const reason = (ExerciseRecommendationService as any).generateRecommendationReason(
        exercise,
        matchedCriteria,
        context
      );
      
      expect(reason).toContain('targets your focus areas');
      expect(reason).toContain('matches your fitness level');
    });

    test('should provide default reason when no criteria match', () => {
      const exercise = mockExercises[0];
      const matchedCriteria: string[] = [];
      const context = {
        userFitnessLevel: 'beginner' as DifficultyLevel,
        availableEquipment: ['none'] as Equipment[],
      };
      
      const reason = (ExerciseRecommendationService as any).generateRecommendationReason(
        exercise,
        matchedCriteria,
        context
      );
      
      expect(reason).toContain('Popular strength exercise');
    });
  });

  describe('Goals to Muscle Groups Mapping', () => {
    test('should map upper body goals to appropriate muscle groups', () => {
      const goals = ['upper body strength'];
      const muscleGroups = (ExerciseRecommendationService as any).mapGoalsToMuscleGroups(goals);
      
      expect(muscleGroups).toContain('chest');
      expect(muscleGroups).toContain('back');
      expect(muscleGroups).toContain('shoulders');
    });

    test('should map lower body goals to appropriate muscle groups', () => {
      const goals = ['lower body strength'];
      const muscleGroups = (ExerciseRecommendationService as any).mapGoalsToMuscleGroups(goals);
      
      expect(muscleGroups).toContain('glutes');
      expect(muscleGroups).toContain('quadriceps');
      expect(muscleGroups).toContain('hamstrings');
    });

    test('should map core goals to core muscle groups', () => {
      const goals = ['core strength'];
      const muscleGroups = (ExerciseRecommendationService as any).mapGoalsToMuscleGroups(goals);
      
      expect(muscleGroups).toContain('abs');
      expect(muscleGroups).toContain('core');
    });

    test('should remove duplicate muscle groups', () => {
      const goals = ['upper body', 'arms']; // Both map to similar muscle groups
      const muscleGroups = (ExerciseRecommendationService as any).mapGoalsToMuscleGroups(goals);
      
      // Should not have duplicates
      const uniqueGroups = [...new Set(muscleGroups)];
      expect(muscleGroups.length).toBe(uniqueGroups.length);
    });
  });
});