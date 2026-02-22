/**
 * Session Data Manager
 * Manages exercise session tracking, persistence, and analytics
 */

export interface ExerciseSessionData {
  id: string;
  userId: string;
  exerciseType: string;
  mode: 'beginner' | 'pro';
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  
  // Performance metrics
  totalReps: number;
  validReps: number;
  invalidReps: number;
  averageRepQuality: number; // 0-100
  
  // Form analysis
  formViolations: {
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }[];
  
  // Rep quality breakdown
  repQualities: number[]; // Quality score per rep
  
  // State machine data
  stateTransitions: number;
  averageRepDuration: number; // in seconds
  
  // Camera positioning
  cameraViewQuality: number; // 0-100
  repositioningCount: number;
  
  // Progress indicators
  personalBest?: {
    metric: string;
    value: number;
    previousBest?: number;
  };
  
  // Session notes
  notes?: string;
  tags?: string[];
}

export interface SessionSummary {
  totalSessions: number;
  totalReps: number;
  averageQuality: number;
  improvementRate: number; // percentage
  commonViolations: string[];
  strengthAreas: string[];
  weaknessAreas: string[];
  progressTrend: 'improving' | 'stable' | 'declining';
}

export class SessionDataManager {
  private static readonly STORAGE_KEY = 'exerciseSessions';
  private static readonly MAX_SESSIONS = 100; // Keep last 100 sessions

  /**
   * Create a new exercise session
   */
  static createSession(
    userId: string,
    exerciseType: string,
    mode: 'beginner' | 'pro'
  ): ExerciseSessionData {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      exerciseType,
      mode,
      startTime: new Date(),
      totalReps: 0,
      validReps: 0,
      invalidReps: 0,
      averageRepQuality: 0,
      formViolations: [],
      repQualities: [],
      stateTransitions: 0,
      averageRepDuration: 0,
      cameraViewQuality: 100,
      repositioningCount: 0,
    };
  }

  /**
   * Update session with rep data
   */
  static updateSessionRep(
    session: ExerciseSessionData,
    repQuality: number,
    isValid: boolean,
    violations: { type: string; severity: 'low' | 'medium' | 'high' }[]
  ): ExerciseSessionData {
    const updated = { ...session };
    
    updated.totalReps++;
    if (isValid) {
      updated.validReps++;
    } else {
      updated.invalidReps++;
    }
    
    updated.repQualities.push(repQuality);
    updated.averageRepQuality = 
      updated.repQualities.reduce((sum, q) => sum + q, 0) / updated.repQualities.length;
    
    // Update form violations
    violations.forEach(violation => {
      const existing = updated.formViolations.find(v => v.type === violation.type);
      if (existing) {
        existing.count++;
      } else {
        updated.formViolations.push({
          type: violation.type,
          count: 1,
          severity: violation.severity,
        });
      }
    });
    
    return updated;
  }

  /**
   * Complete and save session
   */
  static completeSession(session: ExerciseSessionData): ExerciseSessionData {
    const completed = {
      ...session,
      endTime: new Date(),
      duration: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
    };
    
    // Calculate average rep duration
    if (completed.totalReps > 0 && completed.duration) {
      completed.averageRepDuration = completed.duration / completed.totalReps;
    }
    
    // Check for personal bests
    const previousSessions = this.getUserSessions(session.userId, session.exerciseType);
    if (previousSessions.length > 0) {
      const previousBestQuality = Math.max(...previousSessions.map(s => s.averageRepQuality));
      if (completed.averageRepQuality > previousBestQuality) {
        completed.personalBest = {
          metric: 'averageRepQuality',
          value: completed.averageRepQuality,
          previousBest: previousBestQuality,
        };
      }
    }
    
    // Save to storage
    this.saveSession(completed);
    
    return completed;
  }

  /**
   * Save session to localStorage
   */
  private static saveSession(session: ExerciseSessionData): void {
    const sessions = this.getAllSessions();
    sessions.unshift(session);
    
    // Keep only last MAX_SESSIONS
    const trimmed = sessions.slice(0, this.MAX_SESSIONS);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
  }

  /**
   * Get all sessions from storage
   */
  static getAllSessions(): ExerciseSessionData[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      const sessions = JSON.parse(stored);
      // Convert date strings back to Date objects
      return sessions.map((s: ExerciseSessionData) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : undefined,
      }));
    } catch (error) {
      console.error('Failed to parse sessions:', error);
      return [];
    }
  }

  /**
   * Get sessions for specific user and exercise
   */
  static getUserSessions(
    userId: string,
    exerciseType?: string
  ): ExerciseSessionData[] {
    const allSessions = this.getAllSessions();
    return allSessions.filter(
      s => s.userId === userId && (!exerciseType || s.exerciseType === exerciseType)
    );
  }

  /**
   * Get session by ID
   */
  static getSession(sessionId: string): ExerciseSessionData | null {
    const sessions = this.getAllSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  /**
   * Generate session summary for user
   */
  static generateSummary(
    userId: string,
    exerciseType?: string,
    timeRange?: { start: Date; end: Date }
  ): SessionSummary {
    let sessions = this.getUserSessions(userId, exerciseType);
    
    // Filter by time range if provided
    if (timeRange) {
      sessions = sessions.filter(
        s => s.startTime >= timeRange.start && s.startTime <= timeRange.end
      );
    }
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalReps: 0,
        averageQuality: 0,
        improvementRate: 0,
        commonViolations: [],
        strengthAreas: [],
        weaknessAreas: [],
        progressTrend: 'stable',
      };
    }
    
    // Calculate metrics
    const totalReps = sessions.reduce((sum, s) => sum + s.totalReps, 0);
    const averageQuality = 
      sessions.reduce((sum, s) => sum + s.averageRepQuality, 0) / sessions.length;
    
    // Calculate improvement rate (compare first half vs second half)
    const midpoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(midpoint);
    const secondHalf = sessions.slice(0, midpoint);
    
    const firstHalfAvg = firstHalf.length > 0
      ? firstHalf.reduce((sum, s) => sum + s.averageRepQuality, 0) / firstHalf.length
      : 0;
    const secondHalfAvg = secondHalf.length > 0
      ? secondHalf.reduce((sum, s) => sum + s.averageRepQuality, 0) / secondHalf.length
      : 0;
    
    const improvementRate = firstHalfAvg > 0
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
      : 0;
    
    // Determine progress trend
    let progressTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (improvementRate > 5) progressTrend = 'improving';
    else if (improvementRate < -5) progressTrend = 'declining';
    
    // Find common violations
    const violationCounts: Record<string, number> = {};
    sessions.forEach(s => {
      s.formViolations.forEach(v => {
        violationCounts[v.type] = (violationCounts[v.type] || 0) + v.count;
      });
    });
    
    const commonViolations = Object.entries(violationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
    
    // Identify strengths and weaknesses
    const strengthAreas: string[] = [];
    const weaknessAreas: string[] = [];
    
    if (averageQuality >= 80) strengthAreas.push('Overall form quality');
    if (averageQuality < 60) weaknessAreas.push('Overall form quality');
    
    const validRepRate = sessions.reduce((sum, s) => sum + s.validReps, 0) / totalReps;
    if (validRepRate >= 0.9) strengthAreas.push('Rep consistency');
    if (validRepRate < 0.7) weaknessAreas.push('Rep consistency');
    
    return {
      totalSessions: sessions.length,
      totalReps,
      averageQuality,
      improvementRate,
      commonViolations,
      strengthAreas,
      weaknessAreas,
      progressTrend,
    };
  }

  /**
   * Delete old sessions (cleanup)
   */
  static deleteOldSessions(daysToKeep: number = 90): number {
    const sessions = this.getAllSessions();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filtered = sessions.filter(s => s.startTime >= cutoffDate);
    const deletedCount = sessions.length - filtered.length;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    
    return deletedCount;
  }

  /**
   * Export sessions as JSON
   */
  static exportSessions(userId: string): string {
    const sessions = this.getUserSessions(userId);
    return JSON.stringify(sessions, null, 2);
  }

  /**
   * Import sessions from JSON
   */
  static importSessions(jsonData: string): number {
    try {
      const imported = JSON.parse(jsonData) as ExerciseSessionData[];
      const existing = this.getAllSessions();
      
      // Merge and deduplicate
      const merged = [...existing];
      let importedCount = 0;
      
      imported.forEach(session => {
        if (!existing.find(s => s.id === session.id)) {
          merged.push(session);
          importedCount++;
        }
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      return importedCount;
    } catch (error) {
      console.error('Failed to import sessions:', error);
      return 0;
    }
  }
}
