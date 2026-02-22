/**
 * Pose Error Handler
 * Comprehensive error handling and graceful degradation for pose detection system
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'mediapipe_detection'
  | 'angle_calculation'
  | 'state_machine'
  | 'performance'
  | 'camera'
  | 'network'
  | 'storage';

export interface PoseError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  recovered: boolean;
  recoveryAction?: string;
}

export interface ErrorHandlingStrategy {
  maxRetries: number;
  retryDelay: number; // milliseconds
  fallbackBehavior: 'continue' | 'pause' | 'stop';
  userNotification: boolean;
}

export class PoseErrorHandler {
  private static errors: PoseError[] = [];
  private static readonly MAX_ERROR_HISTORY = 50;
  private static errorListeners: ((error: PoseError) => void)[] = [];

  /**
   * Handle MediaPipe detection failure
   */
  static handleMediaPipeFailure(
    error: Error,
    context?: Record<string, unknown>
  ): { recovered: boolean; action: string } {
    const poseError = this.createError(
      'mediapipe_detection',
      'high',
      `MediaPipe detection failed: ${error.message}`,
      context
    );

    // Recovery strategy: Retry with reduced confidence threshold
    const recoveryAction = 'Reducing detection confidence threshold and retrying';
    
    this.logError({ ...poseError, recoveryAction, recovered: true });
    
    return {
      recovered: true,
      action: recoveryAction,
    };
  }

  /**
   * Handle angle calculation error
   */
  static handleAngleCalculationError(
    landmarksMissing: string[],
    context?: Record<string, unknown>
  ): { recovered: boolean; action: string } {
    const severity: ErrorSeverity = landmarksMissing.length > 2 ? 'high' : 'medium';
    
    const poseError = this.createError(
      'angle_calculation',
      severity,
      `Missing landmarks for angle calculation: ${landmarksMissing.join(', ')}`,
      { ...context, landmarksMissing }
    );

    // Recovery strategy: Use previous valid angles or skip frame
    const recoveryAction = landmarksMissing.length > 2
      ? 'Skipping frame - too many missing landmarks'
      : 'Using interpolated values from previous frames';
    
    this.logError({ ...poseError, recoveryAction, recovered: true });
    
    return {
      recovered: true,
      action: recoveryAction,
    };
  }

  /**
   * Handle state machine inconsistency
   */
  static handleStateMachineInconsistency(
    currentState: string,
    expectedState: string,
    context?: Record<string, unknown>
  ): { recovered: boolean; action: string } {
    const poseError = this.createError(
      'state_machine',
      'medium',
      `State machine inconsistency: expected ${expectedState}, got ${currentState}`,
      { ...context, currentState, expectedState }
    );

    // Recovery strategy: Reset state machine to safe state
    const recoveryAction = 'Resetting state machine to initial state';
    
    this.logError({ ...poseError, recoveryAction, recovered: true });
    
    return {
      recovered: true,
      action: recoveryAction,
    };
  }

  /**
   * Handle performance degradation
   */
  static handlePerformanceDegradation(
    fps: number,
    targetFps: number,
    context?: Record<string, unknown>
  ): { recovered: boolean; action: string } {
    const severity: ErrorSeverity = fps < targetFps * 0.5 ? 'high' : 'medium';
    
    const poseError = this.createError(
      'performance',
      severity,
      `Performance degradation: ${fps.toFixed(1)} FPS (target: ${targetFps} FPS)`,
      { ...context, fps, targetFps }
    );

    // Recovery strategy: Reduce processing quality
    let recoveryAction: string;
    if (fps < targetFps * 0.5) {
      recoveryAction = 'Reducing video resolution and detection frequency';
    } else {
      recoveryAction = 'Reducing detection frequency to maintain performance';
    }
    
    this.logError({ ...poseError, recoveryAction, recovered: true });
    
    return {
      recovered: true,
      action: recoveryAction,
    };
  }

  /**
   * Handle camera access error
   */
  static handleCameraError(
    error: Error,
    context?: Record<string, unknown>
  ): { recovered: boolean; action: string } {
    const poseError = this.createError(
      'camera',
      'critical',
      `Camera access failed: ${error.message}`,
      context
    );

    // Recovery strategy: Prompt user to grant permissions
    const recoveryAction = 'Requesting camera permissions from user';
    
    this.logError({ ...poseError, recoveryAction, recovered: false });
    
    return {
      recovered: false,
      action: recoveryAction,
    };
  }

  /**
   * Handle network error (for future cloud features)
   */
  static handleNetworkError(
    error: Error,
    context?: Record<string, unknown>
  ): { recovered: boolean; action: string } {
    const poseError = this.createError(
      'network',
      'medium',
      `Network error: ${error.message}`,
      context
    );

    // Recovery strategy: Continue with local processing
    const recoveryAction = 'Continuing with local processing only';
    
    this.logError({ ...poseError, recoveryAction, recovered: true });
    
    return {
      recovered: true,
      action: recoveryAction,
    };
  }

  /**
   * Handle storage error
   */
  static handleStorageError(
    operation: string,
    error: Error,
    context?: Record<string, unknown>
  ): { recovered: boolean; action: string } {
    const poseError = this.createError(
      'storage',
      'low',
      `Storage ${operation} failed: ${error.message}`,
      { ...context, operation }
    );

    // Recovery strategy: Continue without persistence
    const recoveryAction = 'Continuing without data persistence';
    
    this.logError({ ...poseError, recoveryAction, recovered: true });
    
    return {
      recovered: true,
      action: recoveryAction,
    };
  }

  /**
   * Create error object
   */
  private static createError(
    category: ErrorCategory,
    severity: ErrorSeverity,
    message: string,
    context?: Record<string, unknown>
  ): PoseError {
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      severity,
      message,
      timestamp: new Date(),
      context,
      recovered: false,
    };
  }

  /**
   * Log error to history
   */
  private static logError(error: PoseError): void {
    this.errors.unshift(error);
    
    // Keep only recent errors
    if (this.errors.length > this.MAX_ERROR_HISTORY) {
      this.errors = this.errors.slice(0, this.MAX_ERROR_HISTORY);
    }

    // Notify listeners
    this.errorListeners.forEach(listener => listener(error));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[PoseErrorHandler]', error);
    }
  }

  /**
   * Get error history
   */
  static getErrorHistory(
    category?: ErrorCategory,
    severity?: ErrorSeverity
  ): PoseError[] {
    let filtered = this.errors;
    
    if (category) {
      filtered = filtered.filter(e => e.category === category);
    }
    
    if (severity) {
      filtered = filtered.filter(e => e.severity === severity);
    }
    
    return filtered;
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recoveryRate: number;
  } {
    const byCategory: Record<ErrorCategory, number> = {
      mediapipe_detection: 0,
      angle_calculation: 0,
      state_machine: 0,
      performance: 0,
      camera: 0,
      network: 0,
      storage: 0,
    };
    
    const bySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    
    let recoveredCount = 0;
    
    this.errors.forEach(error => {
      byCategory[error.category]++;
      bySeverity[error.severity]++;
      if (error.recovered) recoveredCount++;
    });
    
    return {
      total: this.errors.length,
      byCategory,
      bySeverity,
      recoveryRate: this.errors.length > 0 ? recoveredCount / this.errors.length : 1,
    };
  }

  /**
   * Clear error history
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Subscribe to error events
   */
  static onError(listener: (error: PoseError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get error handling strategy based on error type
   */
  static getStrategy(category: ErrorCategory, severity: ErrorSeverity): ErrorHandlingStrategy {
    // Critical errors require immediate user notification
    if (severity === 'critical') {
      return {
        maxRetries: 0,
        retryDelay: 0,
        fallbackBehavior: 'stop',
        userNotification: true,
      };
    }

    // High severity errors get limited retries
    if (severity === 'high') {
      return {
        maxRetries: 2,
        retryDelay: 1000,
        fallbackBehavior: 'pause',
        userNotification: true,
      };
    }

    // Medium severity errors get more retries
    if (severity === 'medium') {
      return {
        maxRetries: 5,
        retryDelay: 500,
        fallbackBehavior: 'continue',
        userNotification: false,
      };
    }

    // Low severity errors continue silently
    return {
      maxRetries: 10,
      retryDelay: 100,
      fallbackBehavior: 'continue',
      userNotification: false,
    };
  }

  /**
   * Check if system is healthy
   */
  static isSystemHealthy(): {
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const recentErrors = this.errors.filter(
      e => Date.now() - e.timestamp.getTime() < 60000 // Last minute
    );

    const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
    const highErrors = recentErrors.filter(e => e.severity === 'high');
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (criticalErrors.length > 0) {
      issues.push(`${criticalErrors.length} critical error(s) in the last minute`);
      recommendations.push('Check camera permissions and hardware');
    }

    if (highErrors.length > 3) {
      issues.push(`${highErrors.length} high-severity errors in the last minute`);
      recommendations.push('Consider restarting the session');
    }

    const performanceErrors = recentErrors.filter(e => e.category === 'performance');
    if (performanceErrors.length > 5) {
      issues.push('Frequent performance degradation');
      recommendations.push('Close other applications or reduce video quality');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
