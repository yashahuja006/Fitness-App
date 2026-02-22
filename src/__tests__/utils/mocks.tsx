/**
 * Mock data utilities for testing
 * Provides consistent mock data and Firebase mocking utilities
 */

import React from 'react';
import { UserProfile, PersonalMetrics, UserPreferences } from '@/types/auth';
import { Exercise } from '@/types/exercise';

// ============================================================================
// Mock User Data
// ============================================================================

export const mockPersonalMetrics: PersonalMetrics = {
  height: 175,
  weight: 70,
  age: 30,
  gender: 'male',
  activityLevel: 'moderate',
  fitnessGoals: ['Weight Loss', 'Muscle Gain'],
};

export const mockUserPreferences: UserPreferences = {
  units: 'metric',
  theme: 'auto',
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
};

export const mockUserProfile: UserProfile = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  personalMetrics: mockPersonalMetrics,
  preferences: mockUserPreferences,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockFirebaseUser = {
  uid: 'test-uid-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2024-01-01T00:00:00Z',
    lastSignInTime: '2024-01-01T00:00:00Z',
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
};

// ============================================================================
// Mock Exercise Data
// ============================================================================

export const mockExercise: Exercise = {
  id: 'exercise-123',
  name: 'Push-ups',
  category: 'strength',
  targetMuscles: ['chest', 'arms', 'core'],
  equipment: ['none'],
  difficulty: 'beginner',
  instructions: [
    'Start in a plank position with hands shoulder-width apart',
    'Lower your body until your chest nearly touches the floor',
    'Push back up to the starting position',
    'Repeat for desired number of repetitions',
  ],
  commonMistakes: [
    'Sagging hips or arching back',
    'Not going down far enough',
    'Flaring elbows too wide',
  ],
  safetyTips: [
    'Keep your core engaged throughout the movement',
    'Maintain a straight line from head to heels',
    'Start with modified push-ups if needed',
  ],
  mediaAssets: {
    images: ['https://example.com/pushup1.jpg', 'https://example.com/pushup2.jpg'],
    videos: ['https://example.com/pushup-demo.mp4'],
    demonstrations: ['https://example.com/pushup-form.gif'],
  },
  poseKeypoints: [
    { name: 'left_shoulder', x: 0.3, y: 0.4, visibility: 0.9 },
    { name: 'right_shoulder', x: 0.7, y: 0.4, visibility: 0.9 },
    { name: 'left_elbow', x: 0.25, y: 0.5, visibility: 0.8 },
    { name: 'right_elbow', x: 0.75, y: 0.5, visibility: 0.8 },
  ],
  metadata: {
    createdBy: 'admin-user',
    verified: true,
    popularity: 95,
    tags: ['bodyweight', 'upper-body', 'beginner-friendly'],
  },
};

export const mockExercises: Exercise[] = [
  mockExercise,
  {
    ...mockExercise,
    id: 'exercise-456',
    name: 'Squats',
    category: 'strength',
    targetMuscles: ['legs', 'glutes', 'core'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your body as if sitting back into a chair',
      'Keep your chest up and knees behind your toes',
      'Return to standing position',
    ],
  },
  {
    ...mockExercise,
    id: 'exercise-789',
    name: 'Plank',
    category: 'strength',
    targetMuscles: ['core', 'shoulders', 'back'],
    difficulty: 'beginner',
    instructions: [
      'Start in a push-up position',
      'Lower onto your forearms',
      'Keep your body in a straight line',
      'Hold the position for desired time',
    ],
  },
];

// ============================================================================
// Mock Workout Data
// ============================================================================

export const mockWorkoutSession = {
  id: 'workout-123',
  userId: 'test-uid-123',
  exercises: [
    {
      exerciseId: 'exercise-123',
      sets: [
        { reps: 10, weight: null, duration: null, restTime: 60 },
        { reps: 8, weight: null, duration: null, restTime: 60 },
        { reps: 6, weight: null, duration: null, restTime: 60 },
      ],
      formScores: [0.85, 0.78, 0.82],
      feedback: ['Good form', 'Keep core engaged', 'Excellent improvement'],
      duration: 300,
    },
  ],
  startTime: new Date('2024-01-01T10:00:00Z'),
  endTime: new Date('2024-01-01T10:30:00Z'),
  totalDuration: 1800,
  averageFormScore: 0.82,
  caloriesBurned: 150,
  notes: 'Great workout today!',
};

// ============================================================================
// Mock Diet Data
// ============================================================================

export const mockMeal = {
  id: 'meal-123',
  name: 'Grilled Chicken Salad',
  ingredients: [
    { name: 'Chicken Breast', quantity: 150, unit: 'g' },
    { name: 'Mixed Greens', quantity: 100, unit: 'g' },
    { name: 'Cherry Tomatoes', quantity: 50, unit: 'g' },
    { name: 'Olive Oil', quantity: 1, unit: 'tbsp' },
  ],
  instructions: [
    'Season and grill the chicken breast',
    'Wash and prepare the mixed greens',
    'Cut cherry tomatoes in half',
    'Combine all ingredients and drizzle with olive oil',
  ],
  nutrition: {
    calories: 320,
    protein: 35,
    carbohydrates: 8,
    fats: 15,
    fiber: 4,
  },
  prepTime: 15,
  cookTime: 20,
};

export const mockDietPlan = {
  id: 'diet-123',
  userId: 'test-uid-123',
  planType: 'weight_loss' as const,
  dailyCalories: 1800,
  macronutrients: {
    protein: 30,
    carbohydrates: 40,
    fats: 30,
    fiber: 25,
  },
  meals: [
    {
      day: 1,
      meals: {
        breakfast: mockMeal,
        lunch: { ...mockMeal, id: 'meal-124', name: 'Quinoa Bowl' },
        dinner: { ...mockMeal, id: 'meal-125', name: 'Salmon with Vegetables' },
        snacks: [{ ...mockMeal, id: 'meal-126', name: 'Greek Yogurt' }],
      },
      totalCalories: 1800,
      macroBreakdown: {
        protein: 30,
        carbohydrates: 40,
        fats: 30,
        fiber: 25,
      },
    },
  ],
  duration: 30,
  restrictions: ['gluten_free'],
  generatedAt: new Date('2024-01-01T00:00:00Z'),
  lastModified: new Date('2024-01-01T00:00:00Z'),
};

// ============================================================================
// Mock AI/ML Data
// ============================================================================

export const mockPoseLandmarks = [
  { x: 0.5, y: 0.2, z: 0, visibility: 0.9 }, // nose
  { x: 0.45, y: 0.18, z: 0, visibility: 0.8 }, // left_eye
  { x: 0.55, y: 0.18, z: 0, visibility: 0.8 }, // right_eye
  { x: 0.3, y: 0.4, z: 0, visibility: 0.9 }, // left_shoulder
  { x: 0.7, y: 0.4, z: 0, visibility: 0.9 }, // right_shoulder
];

export const mockFormAnalysis = {
  exerciseId: 'exercise-123',
  correctness: 0.85,
  issues: [
    {
      type: 'posture' as const,
      severity: 'low' as const,
      description: 'Slight forward head posture',
      correction: 'Keep your head in neutral alignment',
      affectedJoints: ['neck'],
    },
  ],
  suggestions: [
    'Focus on keeping your core engaged',
    'Maintain steady breathing throughout the movement',
  ],
  keyPointAccuracy: [
    { joint: 'shoulder', accuracy: 0.92 },
    { joint: 'elbow', accuracy: 0.88 },
    { joint: 'wrist', accuracy: 0.85 },
  ],
};

export const mockChatMessage = {
  id: 'message-123',
  role: 'user' as const,
  content: 'What exercises are good for building chest muscles?',
  timestamp: new Date('2024-01-01T12:00:00Z'),
  metadata: {
    confidence: 0.95,
    sources: ['exercise-database', 'fitness-guidelines'],
    actions: ['search-exercises', 'filter-by-muscle'],
  },
};

// ============================================================================
// Firebase Mock Utilities
// ============================================================================

/**
 * Creates a mock Firestore document snapshot
 */
export const createMockDocSnapshot = (data: any, exists = true) => ({
  exists: () => exists,
  data: () => exists ? data : undefined,
  id: 'mock-doc-id',
  ref: {},
});

/**
 * Creates a mock Firestore query snapshot
 */
export const createMockQuerySnapshot = (docs: any[]) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs.map(data => createMockDocSnapshot(data)),
  forEach: (callback: (doc: any) => void) => {
    docs.forEach(data => callback(createMockDocSnapshot(data)));
  },
});

/**
 * Creates a mock Firebase Auth user
 */
export const createMockAuthUser = (overrides: Partial<typeof mockFirebaseUser> = {}) => ({
  ...mockFirebaseUser,
  ...overrides,
});

/**
 * Creates a mock user profile with optional overrides
 */
export const createMockUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  ...mockUserProfile,
  ...overrides,
});

/**
 * Creates a mock exercise with optional overrides
 */
export const createMockExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  ...mockExercise,
  ...overrides,
});

// ============================================================================
// Test Environment Setup Utilities
// ============================================================================

/**
 * Sets up Firebase mocks for testing
 */
export const setupFirebaseMocks = () => {
  const mockAuth = {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockFirestore = {
    doc: jest.fn(),
    collection: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getDocs: jest.fn(),
    onSnapshot: jest.fn(),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date() })),
      fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
    },
  };

  return { mockAuth, mockFirestore };
};

/**
 * Resets all mocks to their initial state
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
};

/**
 * Creates a test wrapper for React components with providers
 */
export const createTestWrapper = (initialProps: any = {}) => {
  return ({ children }: { children: React.ReactNode }) => {
    // This can be extended to include providers like AuthProvider, etc.
    return <div data-testid="test-wrapper">{children}</div>;
  };
};

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Asserts that a user profile has valid structure
 */
export const assertValidUserProfile = (profile: any) => {
  expect(profile).toBeDefined();
  expect(typeof profile.uid).toBe('string');
  expect(typeof profile.email).toBe('string');
  expect(typeof profile.displayName).toBe('string');
  expect(profile.personalMetrics).toBeDefined();
  expect(profile.preferences).toBeDefined();
  expect(profile.createdAt).toBeInstanceOf(Date);
  expect(profile.updatedAt).toBeInstanceOf(Date);
};

/**
 * Asserts that an exercise has valid structure
 */
export const assertValidExercise = (exercise: any) => {
  expect(exercise).toBeDefined();
  expect(typeof exercise.id).toBe('string');
  expect(typeof exercise.name).toBe('string');
  expect(typeof exercise.category).toBe('string');
  expect(Array.isArray(exercise.targetMuscles)).toBe(true);
  expect(Array.isArray(exercise.equipment)).toBe(true);
  expect(Array.isArray(exercise.instructions)).toBe(true);
  expect(exercise.metadata).toBeDefined();
};

/**
 * Asserts that Firebase Auth calls were made correctly
 */
export const assertFirebaseAuthCalls = (mockAuth: any, expectedCalls: string[]) => {
  expectedCalls.forEach(call => {
    expect(mockAuth[call]).toHaveBeenCalled();
  });
};

/**
 * Asserts that Firestore calls were made correctly
 */
export const assertFirestoreCalls = (mockFirestore: any, expectedCalls: string[]) => {
  expectedCalls.forEach(call => {
    expect(mockFirestore[call]).toHaveBeenCalled();
  });
};