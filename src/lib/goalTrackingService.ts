/**
 * Goal Tracking and Notification Service
 * 
 * Task 10.3: Progress Tracking and Analytics - Create goal tracking and notification system
 * - Implemented fitness goal setting and monitoring
 * - Created milestone detection and notification system
 * - Built data export functionality for reports
 */

import type { WorkoutGoal, Achievement } from '@/types/workout';

export interface GoalNotification {
  id: string;
  goalId: string;
  type: 'milestone' | 'deadline_approaching' | 'goal_completed' | 'goal_failed';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

export interface GoalTrackingConfig {
  enableNotifications: boolean;
  deadlineWarningDays: number; // Days before deadline to send warning
  milestoneThresholds: number[]; // Percentage thresholds for milestone notifications
  autoArchiveCompletedGoals: boolean;
  maxActiveGoals: number;
}

const DEFAULT_CONFIG: GoalTrackingConfig = {
  enableNotifications: true,
  deadlineWarningDays: 3,
  milestoneThresholds: [25, 50, 75, 90],
  autoArchiveCompletedGoals: true,
  maxActiveGoals: 10
};

export class GoalTrackingService {
  private config: GoalTrackingConfig;
  private goals: WorkoutGoal[] = [];
  private notifications: GoalNotification[] = [];
  private achievements: Achievement[] = [];

  constructor(config: Partial<GoalTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
  }

  /**
   * Create a new fitness goal
   */
  createGoal(goalData: Omit<WorkoutGoal, 'id'>): WorkoutGoal {
    if (this.goals.filter(g => !g.isCompleted && !g.isArchived).length >= this.config.maxActiveGoals) {
      throw new Error(`Maximum of ${this.config.maxActiveGoals} active goals allowed`);
    }

    const goal: WorkoutGoal = {
      ...goalData,
      id: this.generateId('goal'),
      isCompleted: false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.goals.push(goal);
    this.saveToStorage();

    // Create initial notification
    this.createNotification({
      goalId: goal.id,
      type: 'milestone',
      title: 'New Goal Created',
      message: `Goal "${goal.title}" has been created. Let's achieve it!`,
      timestamp: new Date()
    });

    return goal;
  }

  /**
   * Update goal progress
   */
  updateGoalProgress(goalId: string, newCurrentValue: number): WorkoutGoal | null {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal || goal.isCompleted || goal.isArchived) {
      return null;
    }

    const previousProgress = this.getProgressPercentage(goal.currentValue, goal.targetValue);
    goal.currentValue = newCurrentValue;
    goal.updatedAt = new Date();

    const newProgress = this.getProgressPercentage(goal.currentValue, goal.targetValue);

    // Check for milestone notifications
    this.checkMilestones(goal, previousProgress, newProgress);

    // Check for goal completion
    if (newProgress >= 100 && !goal.isCompleted) {
      this.completeGoal(goalId);
    }

    this.saveToStorage();
    return goal;
  }

  /**
   * Complete a goal
   */
  completeGoal(goalId: string): WorkoutGoal | null {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal || goal.isCompleted) {
      return null;
    }

    goal.isCompleted = true;
    goal.completedAt = new Date();
    goal.updatedAt = new Date();

    // Create completion notification
    this.createNotification({
      goalId: goal.id,
      type: 'goal_completed',
      title: 'Goal Completed! 🎉',
      message: `Congratulations! You've achieved "${goal.title}"`,
      timestamp: new Date()
    });

    // Create achievement
    this.createAchievement({
      title: 'Goal Achiever',
      description: `Completed goal: ${goal.title}`,
      category: goal.category,
      unlockedAt: new Date()
    });

    // Auto-archive if enabled
    if (this.config.autoArchiveCompletedGoals) {
      setTimeout(() => this.archiveGoal(goalId), 7 * 24 * 60 * 60 * 1000); // Archive after 7 days
    }

    this.saveToStorage();
    return goal;
  }

  /**
   * Archive a goal
   */
  archiveGoal(goalId: string): WorkoutGoal | null {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) {
      return null;
    }

    goal.isArchived = true;
    goal.updatedAt = new Date();
    this.saveToStorage();
    return goal;
  }

  /**
   * Delete a goal
   */
  deleteGoal(goalId: string): boolean {
    const index = this.goals.findIndex(g => g.id === goalId);
    if (index === -1) {
      return false;
    }

    this.goals.splice(index, 1);
    
    // Remove related notifications
    this.notifications = this.notifications.filter(n => n.goalId !== goalId);
    
    this.saveToStorage();
    return true;
  }

  /**
   * Get all goals with optional filtering
   */
  getGoals(filter?: {
    includeCompleted?: boolean;
    includeArchived?: boolean;
    category?: string;
  }): WorkoutGoal[] {
    let filteredGoals = [...this.goals];

    if (filter) {
      if (!filter.includeCompleted) {
        filteredGoals = filteredGoals.filter(g => !g.isCompleted);
      }
      if (!filter.includeArchived) {
        filteredGoals = filteredGoals.filter(g => !g.isArchived);
      }
      if (filter.category) {
        filteredGoals = filteredGoals.filter(g => g.category === filter.category);
      }
    }

    return filteredGoals.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get active goals (not completed or archived)
   */
  getActiveGoals(): WorkoutGoal[] {
    return this.getGoals({ includeCompleted: false, includeArchived: false });
  }

  /**
   * Check for deadline warnings and send notifications
   */
  checkDeadlineWarnings(): void {
    const now = new Date();
    const warningThreshold = new Date(now.getTime() + this.config.deadlineWarningDays * 24 * 60 * 60 * 1000);

    this.getActiveGoals().forEach(goal => {
      if (goal.deadline && goal.deadline <= warningThreshold && goal.deadline > now) {
        // Check if we already sent a warning for this goal
        const existingWarning = this.notifications.find(
          n => n.goalId === goal.id && n.type === 'deadline_approaching'
        );

        if (!existingWarning) {
          const daysLeft = Math.ceil((goal.deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          this.createNotification({
            goalId: goal.id,
            type: 'deadline_approaching',
            title: 'Deadline Approaching',
            message: `Goal "${goal.title}" is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
            timestamp: new Date()
          });
        }
      }
    });
  }

  /**
   * Check for failed goals (past deadline and not completed)
   */
  checkFailedGoals(): void {
    const now = new Date();

    this.getActiveGoals().forEach(goal => {
      if (goal.deadline && goal.deadline < now && !goal.isCompleted) {
        this.createNotification({
          goalId: goal.id,
          type: 'goal_failed',
          title: 'Goal Deadline Passed',
          message: `Goal "${goal.title}" deadline has passed. Consider extending or creating a new goal.`,
          timestamp: new Date()
        });

        // Optionally auto-archive failed goals
        if (this.config.autoArchiveCompletedGoals) {
          this.archiveGoal(goal.id);
        }
      }
    });
  }

  /**
   * Get notifications
   */
  getNotifications(unreadOnly: boolean = false): GoalNotification[] {
    let notifications = [...this.notifications];
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveToStorage();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.saveToStorage();
  }

  /**
   * Get achievements
   */
  getAchievements(): Achievement[] {
    return [...this.achievements].sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime());
  }

  /**
   * Export goals and progress data
   */
  exportData(): {
    goals: WorkoutGoal[];
    notifications: GoalNotification[];
    achievements: Achievement[];
    exportDate: Date;
  } {
    return {
      goals: this.goals,
      notifications: this.notifications,
      achievements: this.achievements,
      exportDate: new Date()
    };
  }

  /**
   * Import goals and progress data
   */
  importData(data: {
    goals?: WorkoutGoal[];
    notifications?: GoalNotification[];
    achievements?: Achievement[];
  }): void {
    if (data.goals) {
      this.goals = data.goals.map(goal => ({
        ...goal,
        createdAt: new Date(goal.createdAt),
        updatedAt: new Date(goal.updatedAt),
        deadline: goal.deadline ? new Date(goal.deadline) : undefined,
        completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined
      }));
    }

    if (data.notifications) {
      this.notifications = data.notifications.map(notification => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
    }

    if (data.achievements) {
      this.achievements = data.achievements.map(achievement => ({
        ...achievement,
        unlockedAt: new Date(achievement.unlockedAt)
      }));
    }

    this.saveToStorage();
  }

  /**
   * Private helper methods
   */
  private checkMilestones(goal: WorkoutGoal, previousProgress: number, newProgress: number): void {
    this.config.milestoneThresholds.forEach(threshold => {
      if (previousProgress < threshold && newProgress >= threshold) {
        this.createNotification({
          goalId: goal.id,
          type: 'milestone',
          title: `${threshold}% Milestone Reached!`,
          message: `You're ${threshold}% of the way to achieving "${goal.title}"`,
          timestamp: new Date()
        });
      }
    });
  }

  private createNotification(notificationData: Omit<GoalNotification, 'id' | 'isRead'>): void {
    if (!this.config.enableNotifications) return;

    const notification: GoalNotification = {
      ...notificationData,
      id: this.generateId('notification'),
      isRead: false
    };

    this.notifications.push(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(-100);
    }
  }

  private createAchievement(achievementData: Omit<Achievement, 'id'>): void {
    const achievement: Achievement = {
      ...achievementData,
      id: this.generateId('achievement')
    };

    this.achievements.push(achievement);
  }

  private getProgressPercentage(current: number, target: number): number {
    return target > 0 ? Math.min(100, (current / target) * 100) : 0;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private loadFromStorage(): void {
    try {
      const goalsData = localStorage.getItem('fitness-app-goals');
      const notificationsData = localStorage.getItem('fitness-app-goal-notifications');
      const achievementsData = localStorage.getItem('fitness-app-achievements');

      if (goalsData) {
        this.goals = JSON.parse(goalsData).map((goal: any) => ({
          ...goal,
          createdAt: new Date(goal.createdAt),
          updatedAt: new Date(goal.updatedAt),
          deadline: goal.deadline ? new Date(goal.deadline) : undefined,
          completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined
        }));
      }

      if (notificationsData) {
        this.notifications = JSON.parse(notificationsData).map((notification: any) => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }));
      }

      if (achievementsData) {
        this.achievements = JSON.parse(achievementsData).map((achievement: any) => ({
          ...achievement,
          unlockedAt: new Date(achievement.unlockedAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load goal tracking data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('fitness-app-goals', JSON.stringify(this.goals));
      localStorage.setItem('fitness-app-goal-notifications', JSON.stringify(this.notifications));
      localStorage.setItem('fitness-app-achievements', JSON.stringify(this.achievements));
    } catch (error) {
      console.error('Failed to save goal tracking data to storage:', error);
    }
  }

  /**
   * Run periodic checks (should be called regularly, e.g., daily)
   */
  runPeriodicChecks(): void {
    this.checkDeadlineWarnings();
    this.checkFailedGoals();
  }
}

// Export singleton instance
export const goalTrackingService = new GoalTrackingService();