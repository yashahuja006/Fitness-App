/**
 * Property-Based Tests for Session Data Manager
 * Task 13.2: Write property test for session progress data generation
 * 
 * **Property 16: Session Progress Data Generation**
 * **Validates: Requirements 6.4**
 * 
 * For any completed exercise session, progress tracking data should be generated and stored.
 */

import * as fc from 'fast-check';
import { SessionDataManager, ExerciseSessionData } from '@/lib/sessionDataManager';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Setup localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Test data generators
const userIdArbitrary = fc.string({ minLength: 1, maxLength: 20 });
const exerciseTypeArbitrary = fc.constantFrom('squat', 'pushup', 'plank', 'lunge');
const modeArbitrary = fc.constantFrom('beginner', 'pro') as fc.Arbitrary<'beginner' | 'pro'>;
const repQualityArbitrary = fc.integer({ min: 0, max: 100 });
const severityArbitrary = fc.constantFrom('low', 'medium', 'high') as fc.Arbitrary<'low' | 'medium' | 'high'>;
const violationTypeArbitrary = fc.constantFrom(
  'knee_over_toes',
  'insufficient_depth',
  'excessive_depth',
  'forward_lean',
  'backward_lean'
);

const violationArbitrary = fc.record({
  type: violationTypeArbitrary,
  severity: severityArbitrary,
});

const repDataArbitrary = fc.record({
  quality: repQualityArbitrary,
  isValid: fc.boolean(),
  violations: fc.array(violationArbitrary, { maxLength: 3 }),
});

describe('Session Data Manager Property Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  /**
   * **Property 16: Session Progress Data Generation**
   * 
   * For any completed exercise session, progress tracking data should be generated and stored.
   * **Validates: Requirements 6.4**
   */
  describe('Property 16: Session Progress Data Generation', () => {
    test('**Feature: advanced-pose-analysis, Property 16.1: Session Creation** - For any valid user and exercise configuration, a session should be created with all required fields', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          exerciseTypeArbitrary,
          modeArbitrary,
          (userId, exerciseType, mode) => {
            const session = SessionDataManager.createSession(userId, exerciseType, mode);

            // Verify all required fields are present
            expect(session.id).toBeDefined();
            expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
            expect(session.userId).toBe(userId);
            expect(session.exerciseType).toBe(exerciseType);
            expect(session.mode).toBe(mode);
            expect(session.startTime).toBeInstanceOf(Date);
            expect(session.totalReps).toBe(0);
            expect(session.validReps).toBe(0);
            expect(session.invalidReps).toBe(0);
            expect(session.averageRepQuality).toBe(0);
            expect(session.formViolations).toEqual([]);
            expect(session.repQualities).toEqual([]);
            expect(session.stateTransitions).toBe(0);
            expect(session.averageRepDuration).toBe(0);
            expect(session.cameraViewQuality).toBe(100);
            expect(session.repositioningCount).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 16.2: Rep Data Tracking** - For any rep added to a session, the session should correctly update rep counts and quality metrics', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          exerciseTypeArbitrary,
          modeArbitrary,
          fc.array(repDataArbitrary, { minLength: 1, maxLength: 20 }),
          (userId, exerciseType, mode, reps) => {
            let session = SessionDataManager.createSession(userId, exerciseType, mode);

            // Add each rep to the session
            reps.forEach((rep) => {
              session = SessionDataManager.updateSessionRep(
                session,
                rep.quality,
                rep.isValid,
                rep.violations
              );
            });

            // Verify rep counts
            expect(session.totalReps).toBe(reps.length);
            expect(session.validReps).toBe(reps.filter((r) => r.isValid).length);
            expect(session.invalidReps).toBe(reps.filter((r) => !r.isValid).length);
            expect(session.validReps + session.invalidReps).toBe(session.totalReps);

            // Verify quality tracking
            expect(session.repQualities).toHaveLength(reps.length);
            const expectedAvgQuality =
              reps.reduce((sum, r) => sum + r.quality, 0) / reps.length;
            expect(session.averageRepQuality).toBeCloseTo(expectedAvgQuality, 5);

            // Verify form violations are tracked
            const violationTypes = new Set(
              reps.flatMap((r) => r.violations.map((v) => v.type))
            );
            violationTypes.forEach((type) => {
              const violation = session.formViolations.find((v) => v.type === type);
              expect(violation).toBeDefined();
              expect(violation!.count).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 16.3: Session Completion** - For any session with reps, completing the session should calculate duration and save to storage', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          exerciseTypeArbitrary,
          modeArbitrary,
          fc.array(repDataArbitrary, { minLength: 1, maxLength: 10 }),
          (userId, exerciseType, mode, reps) => {
            let session = SessionDataManager.createSession(userId, exerciseType, mode);

            // Add reps
            reps.forEach((rep) => {
              session = SessionDataManager.updateSessionRep(
                session,
                rep.quality,
                rep.isValid,
                rep.violations
              );
            });

            // Complete the session
            const completed = SessionDataManager.completeSession(session);

            // Verify completion data
            expect(completed.endTime).toBeInstanceOf(Date);
            expect(completed.duration).toBeDefined();
            expect(completed.duration).toBeGreaterThanOrEqual(0);
            expect(completed.averageRepDuration).toBeGreaterThanOrEqual(0);

            // Verify session is saved
            const retrieved = SessionDataManager.getSession(completed.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved!.id).toBe(completed.id);
            expect(retrieved!.totalReps).toBe(completed.totalReps);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 16.4: Form Violation Tracking** - For any sequence of reps with violations, violations should be correctly aggregated and counted', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          exerciseTypeArbitrary,
          modeArbitrary,
          fc.array(
            fc.record({
              quality: repQualityArbitrary,
              isValid: fc.boolean(),
              violations: fc.array(violationArbitrary, { minLength: 1, maxLength: 3 }),
            }),
            { minLength: 1, maxLength: 15 }
          ),
          (userId, exerciseType, mode, reps) => {
            let session = SessionDataManager.createSession(userId, exerciseType, mode);

            // Track expected violation counts
            const expectedViolationCounts: Record<string, number> = {};
            reps.forEach((rep) => {
              rep.violations.forEach((v) => {
                expectedViolationCounts[v.type] =
                  (expectedViolationCounts[v.type] || 0) + 1;
              });
            });

            // Add reps to session
            reps.forEach((rep) => {
              session = SessionDataManager.updateSessionRep(
                session,
                rep.quality,
                rep.isValid,
                rep.violations
              );
            });

            // Verify violation counts match
            Object.entries(expectedViolationCounts).forEach(([type, count]) => {
              const violation = session.formViolations.find((v) => v.type === type);
              expect(violation).toBeDefined();
              expect(violation!.count).toBe(count);
            });

            // Verify no extra violations
            expect(session.formViolations.length).toBe(
              Object.keys(expectedViolationCounts).length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 16.5: Session Summary Generation** - For any set of completed sessions, a summary should be generated with correct metrics', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          exerciseTypeArbitrary,
          modeArbitrary,
          fc.array(
            fc.array(repDataArbitrary, { minLength: 1, maxLength: 10 }),
            { minLength: 1, maxLength: 5 }
          ),
          (userId, exerciseType, mode, sessionReps) => {
            localStorageMock.clear();

            // Create and complete multiple sessions
            sessionReps.forEach((reps) => {
              let session = SessionDataManager.createSession(userId, exerciseType, mode);
              reps.forEach((rep) => {
                session = SessionDataManager.updateSessionRep(
                  session,
                  rep.quality,
                  rep.isValid,
                  rep.violations
                );
              });
              SessionDataManager.completeSession(session);
            });

            // Generate summary
            const summary = SessionDataManager.generateSummary(userId, exerciseType);

            // Verify summary metrics
            expect(summary.totalSessions).toBe(sessionReps.length);
            expect(summary.totalReps).toBe(
              sessionReps.reduce((sum, reps) => sum + reps.length, 0)
            );
            expect(summary.averageQuality).toBeGreaterThanOrEqual(0);
            expect(summary.averageQuality).toBeLessThanOrEqual(100);
            expect(summary.progressTrend).toMatch(/^(improving|stable|declining)$/);
            expect(Array.isArray(summary.commonViolations)).toBe(true);
            expect(Array.isArray(summary.strengthAreas)).toBe(true);
            expect(Array.isArray(summary.weaknessAreas)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 16.6: Progress Trend Calculation** - For any sequence of sessions, the progress trend should reflect quality improvement or decline', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          exerciseTypeArbitrary,
          modeArbitrary,
          fc.array(
            fc.record({
              reps: fc.array(
                fc.record({
                  quality: repQualityArbitrary,
                  isValid: fc.boolean(),
                  violations: fc.array(violationArbitrary, { maxLength: 2 }),
                }),
                { minLength: 3, maxLength: 8 }
              ),
            }),
            { minLength: 4, maxLength: 10 }
          ),
          (userId, exerciseType, mode, sessions) => {
            localStorageMock.clear();

            // Create sessions with known quality progression
            const sessionQualities: number[] = [];
            sessions.forEach((sessionData) => {
              let session = SessionDataManager.createSession(userId, exerciseType, mode);
              sessionData.reps.forEach((rep) => {
                session = SessionDataManager.updateSessionRep(
                  session,
                  rep.quality,
                  rep.isValid,
                  rep.violations
                );
              });
              const completed = SessionDataManager.completeSession(session);
              sessionQualities.push(completed.averageRepQuality);
            });

            // Generate summary
            const summary = SessionDataManager.generateSummary(userId, exerciseType);

            // IMPORTANT: Sessions are stored with newest first (unshift)
            // So we need to reverse the order to match how they're stored
            const storedOrder = [...sessionQualities].reverse();
            
            // Calculate expected trend (matching implementation)
            const midpoint = Math.floor(storedOrder.length / 2);
            const firstHalf = storedOrder.slice(midpoint); // Older sessions
            const secondHalf = storedOrder.slice(0, midpoint); // Newer sessions

            const firstAvg =
              firstHalf.reduce((sum, q) => sum + q, 0) / firstHalf.length;
            const secondAvg =
              secondHalf.reduce((sum, q) => sum + q, 0) / secondHalf.length;

            // Match the implementation's improvement rate calculation
            const improvementRate = firstAvg > 0
              ? ((secondAvg - firstAvg) / firstAvg) * 100
              : 0;

            // Verify trend matches calculation (implementation logic)
            if (improvementRate > 5) {
              expect(summary.progressTrend).toBe('improving');
            } else if (improvementRate < -5) {
              expect(summary.progressTrend).toBe('declining');
            } else {
              expect(summary.progressTrend).toBe('stable');
            }

            // Verify improvement rate matches
            expect(summary.improvementRate).toBeCloseTo(improvementRate, 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 16.7: Personal Best Detection** - For any session with quality exceeding previous sessions, a personal best should be recorded', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          exerciseTypeArbitrary,
          modeArbitrary,
          fc.array(repQualityArbitrary, { minLength: 3, maxLength: 8 }),
          fc.array(repQualityArbitrary, { minLength: 3, maxLength: 8 }),
          (userId, exerciseType, mode, firstSessionQualities, secondSessionQualities) => {
            localStorageMock.clear();

            // Create first session
            let session1 = SessionDataManager.createSession(userId, exerciseType, mode);
            firstSessionQualities.forEach((quality) => {
              session1 = SessionDataManager.updateSessionRep(session1, quality, true, []);
            });
            const completed1 = SessionDataManager.completeSession(session1);

            // Create second session
            let session2 = SessionDataManager.createSession(userId, exerciseType, mode);
            secondSessionQualities.forEach((quality) => {
              session2 = SessionDataManager.updateSessionRep(session2, quality, true, []);
            });
            const completed2 = SessionDataManager.completeSession(session2);

            // Check personal best logic
            if (completed2.averageRepQuality > completed1.averageRepQuality) {
              expect(completed2.personalBest).toBeDefined();
              expect(completed2.personalBest!.metric).toBe('averageRepQuality');
              expect(completed2.personalBest!.value).toBe(completed2.averageRepQuality);
              expect(completed2.personalBest!.previousBest).toBe(
                completed1.averageRepQuality
              );
            } else {
              // If not better, no personal best should be set
              expect(completed2.personalBest).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('**Feature: advanced-pose-analysis, Property 16.8: Session Storage Limits** - For any number of sessions, only the most recent MAX_SESSIONS should be retained', () => {
      fc.assert(
        fc.property(
          userIdArbitrary,
          exerciseTypeArbitrary,
          modeArbitrary,
          fc.integer({ min: 101, max: 120 }),
          (userId, exerciseType, mode, sessionCount) => {
            localStorageMock.clear();

            // Create more sessions than the limit
            for (let i = 0; i < sessionCount; i++) {
              let session = SessionDataManager.createSession(userId, exerciseType, mode);
              session = SessionDataManager.updateSessionRep(session, 75, true, []);
              SessionDataManager.completeSession(session);
            }

            // Verify only MAX_SESSIONS are stored
            const allSessions = SessionDataManager.getAllSessions();
            expect(allSessions.length).toBeLessThanOrEqual(100); // MAX_SESSIONS = 100
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Feature: advanced-pose-analysis, Property 16: Session Progress Data Generation
 * Validates: Requirements 6.4
 */
