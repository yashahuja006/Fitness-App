/**
 * Test configuration and constants
 * Centralized configuration for all testing scenarios
 */

// ============================================================================
// Property-Based Test Configurations
// ============================================================================

/**
 * Default configuration for property-based tests
 * Used for standard testing scenarios
 */
export const DEFAULT_PBT_CONFIG = {
  numRuns: 100,
  timeout: 10000,
  seed: 42, // For reproducible tests
  endOnFailure: true,
  verbose: false,
};

/**
 * Fast configuration for quick feedback during development
 * Reduced iterations for faster test execution
 */
export const FAST_PBT_CONFIG = {
  numRuns: 25,
  timeout: 5000,
  seed: 42,
  endOnFailure: true,
  verbose: false,
};

/**
 * Thorough configuration for comprehensive testing
 * Increased iterations for thorough coverage
 */
export const THOROUGH_PBT_CONFIG = {
  numRuns: 500,
  timeout: 30000,
  seed: 42,
  endOnFailure: false,
  verbose: true,
};

/**
 * CI/CD configuration optimized for continuous integration
 * Balanced between thoroughness and execution time
 */
export const CI_PBT_CONFIG = {
  numRuns: 200,
  timeout: 15000,
  seed: 42,
  endOnFailure: true,
  verbose: false,
};

// ============================================================================
// Test Environment Constants
// ============================================================================

/**
 * Test timeouts for different types of tests
 */
export const TEST_TIMEOUTS = {
  UNIT: 5000,
  INTEGRATION: 10000,
  PROPERTY: 30000,
  E2E: 60000,
} as const;

/**
 * Test data generation limits
 */
export const GENERATION_LIMITS = {
  MIN_SAMPLES: 10,
  DEFAULT_SAMPLES: 100,
  MAX_SAMPLES: 1000,
  PERFORMANCE_THRESHOLD: 1000, // milliseconds
} as const;

/**
 * Mock data constants
 */
export const MOCK_CONSTANTS = {
  DEFAULT_USER_ID: 'test-uid-123',
  DEFAULT_EMAIL: 'test@example.com',
  DEFAULT_DISPLAY_NAME: 'Test User',
  DEFAULT_EXERCISE_ID: 'exercise-123',
  DEFAULT_WORKOUT_ID: 'workout-123',
  DEFAULT_DIET_PLAN_ID: 'diet-123',
} as const;

// ============================================================================
// Test Categories and Tags
// ============================================================================

/**
 * Test categories for organizing and filtering tests
 */
export const TEST_CATEGORIES = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  PROPERTY: 'property',
  E2E: 'e2e',
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility',
  SECURITY: 'security',
} as const;

/**
 * Feature tags for test organization
 */
export const FEATURE_TAGS = {
  AUTH: 'auth',
  EXERCISE: 'exercise',
  WORKOUT: 'workout',
  DIET: 'diet',
  AI_FORM: 'ai-form',
  CHATBOT: 'chatbot',
  VOICE: 'voice',
  PROGRESS: 'progress',
  SOCIAL: 'social',
  ADMIN: 'admin',
  CALENDAR: 'calendar',
  NOTIFICATIONS: 'notifications',
  UI: 'ui',
} as const;

// ============================================================================
// Test Data Constraints
// ============================================================================

/**
 * Validation constraints for test data generation
 */
export const VALIDATION_CONSTRAINTS = {
  USER_PROFILE: {
    MIN_HEIGHT: 50,
    MAX_HEIGHT: 300,
    MIN_WEIGHT: 20,
    MAX_WEIGHT: 500,
    MIN_AGE: 13,
    MAX_AGE: 120,
    MIN_FITNESS_GOALS: 1,
    MAX_FITNESS_GOALS: 5,
  },
  EXERCISE: {
    MIN_NAME_LENGTH: 3,
    MAX_NAME_LENGTH: 50,
    MIN_INSTRUCTIONS: 3,
    MAX_INSTRUCTIONS: 10,
    MIN_TARGET_MUSCLES: 1,
    MAX_TARGET_MUSCLES: 5,
  },
  WORKOUT: {
    MIN_DURATION: 300, // 5 minutes
    MAX_DURATION: 7200, // 2 hours
    MIN_CALORIES: 50,
    MAX_CALORIES: 1000,
    MIN_FORM_SCORE: 0,
    MAX_FORM_SCORE: 1,
  },
  DIET: {
    MIN_CALORIES: 1000,
    MAX_CALORIES: 5000,
    MIN_PROTEIN: 10,
    MAX_PROTEIN: 40,
    MIN_CARBS: 20,
    MAX_CARBS: 65,
    MIN_FATS: 15,
    MAX_FATS: 35,
  },
} as const;

// ============================================================================
// Test Utilities Configuration
// ============================================================================

/**
 * Configuration for test utilities and helpers
 */
export const UTILITY_CONFIG = {
  MOCK_DELAY: 100, // milliseconds
  ASYNC_TIMEOUT: 5000, // milliseconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 100, // milliseconds
} as const;

/**
 * Firebase mock configuration
 */
export const FIREBASE_MOCK_CONFIG = {
  AUTH_DELAY: 100,
  FIRESTORE_DELAY: 50,
  STORAGE_DELAY: 200,
  ENABLE_OFFLINE_MODE: false,
} as const;

// ============================================================================
// Performance Benchmarks
// ============================================================================

/**
 * Performance benchmarks for different operations
 */
export const PERFORMANCE_BENCHMARKS = {
  COMPONENT_RENDER: 100, // milliseconds
  DATA_GENERATION: 1000, // milliseconds for 100 items
  PROPERTY_TEST_SUITE: 30000, // milliseconds
  API_RESPONSE: 2000, // milliseconds
  DATABASE_QUERY: 1000, // milliseconds
} as const;

// ============================================================================
// Test Environment Detection
// ============================================================================

/**
 * Detects the current test environment
 */
export const getTestEnvironment = () => {
  if (process.env.CI) return 'ci';
  if (process.env.NODE_ENV === 'test') return 'test';
  if (process.env.NODE_ENV === 'development') return 'development';
  return 'unknown';
};

/**
 * Gets the appropriate PBT configuration based on environment
 */
export const getPBTConfig = () => {
  const env = getTestEnvironment();
  
  switch (env) {
    case 'ci':
      return CI_PBT_CONFIG;
    case 'development':
      return FAST_PBT_CONFIG;
    case 'test':
      return DEFAULT_PBT_CONFIG;
    default:
      return DEFAULT_PBT_CONFIG;
  }
};

// ============================================================================
// Test Reporting Configuration
// ============================================================================

/**
 * Configuration for test reporting and coverage
 */
export const REPORTING_CONFIG = {
  COVERAGE_THRESHOLD: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  REPORT_FORMATS: ['text', 'lcov', 'html'],
  OUTPUT_DIRECTORY: 'coverage',
} as const;

/**
 * Property test reporting configuration
 */
export const PBT_REPORTING_CONFIG = {
  INCLUDE_COUNTEREXAMPLES: true,
  INCLUDE_SHRINKING_STEPS: true,
  INCLUDE_TIMING: true,
  MAX_COUNTEREXAMPLE_LENGTH: 1000,
} as const;

// ============================================================================
// Export All Configurations
// ============================================================================

export const TEST_CONFIG = {
  PBT: {
    DEFAULT: DEFAULT_PBT_CONFIG,
    FAST: FAST_PBT_CONFIG,
    THOROUGH: THOROUGH_PBT_CONFIG,
    CI: CI_PBT_CONFIG,
  },
  TIMEOUTS: TEST_TIMEOUTS,
  LIMITS: GENERATION_LIMITS,
  MOCKS: MOCK_CONSTANTS,
  CATEGORIES: TEST_CATEGORIES,
  FEATURES: FEATURE_TAGS,
  CONSTRAINTS: VALIDATION_CONSTRAINTS,
  UTILITIES: UTILITY_CONFIG,
  FIREBASE: FIREBASE_MOCK_CONFIG,
  PERFORMANCE: PERFORMANCE_BENCHMARKS,
  REPORTING: REPORTING_CONFIG,
  PBT_REPORTING: PBT_REPORTING_CONFIG,
} as const;

export default TEST_CONFIG;