import { UserProgramProfile, Goal, Difficulty, RecoveryQuality } from '@/types/program';
import { UserWorkoutProfile } from '@/components/workouts/WorkoutOnboarding';

export class ProfileConverter {
  /**
   * Convert workout profile to program profile
   */
  static workoutToProgram(workoutProfile: UserWorkoutProfile): UserProgramProfile {
    return {
      primaryGoal: this.convertGoal(workoutProfile.goal),
      experienceLevel: this.convertExperience(workoutProfile.fitnessLevel),
      daysPerWeek: workoutProfile.daysPerWeek,
      equipment: this.convertEquipment(workoutProfile.equipment),
      recoveryQuality: this.estimateRecovery(workoutProfile),
      preferredTime: workoutProfile.preferredTime,
      injuries: workoutProfile.injuries,
    };
  }

  /**
   * Convert goal format
   */
  private static convertGoal(goal: string): Goal {
    const goalMap: Record<string, Goal> = {
      'lose_weight': 'fat_loss',
      'build_muscle': 'muscle_gain',
      'get_fit': 'recomp',
      'maintain': 'recomp',
    };

    return goalMap[goal] || 'recomp';
  }

  /**
   * Convert experience level
   */
  private static convertExperience(level: string): Difficulty {
    const levelMap: Record<string, Difficulty> = {
      'beginner': 'beginner',
      'intermediate': 'intermediate',
      'advanced': 'advanced',
    };

    return levelMap[level] || 'beginner';
  }

  /**
   * Convert equipment list
   */
  private static convertEquipment(equipment: string): string[] {
    const equipmentMap: Record<string, string[]> = {
      'full_gym': ['Full gym', 'Barbell', 'Dumbbells', 'Cable Machine', 'Bench', 'Squat Rack'],
      'home_gym': ['Dumbbells', 'Bench', 'Barbell'],
      'minimal': ['Dumbbells'],
      'bodyweight': ['None'],
    };

    return equipmentMap[equipment] || ['None'];
  }

  /**
   * Estimate recovery quality
   */
  private static estimateRecovery(profile: UserWorkoutProfile): RecoveryQuality {
    // This is a simple estimation - in a real app, you'd ask the user directly
    // For now, assume good recovery for most users
    return 'good';
  }

  /**
   * Save program profile to localStorage
   */
  static saveProgramProfile(profile: UserProgramProfile): void {
    localStorage.setItem('userProgramProfile', JSON.stringify(profile));
  }

  /**
   * Load program profile from localStorage
   */
  static loadProgramProfile(): UserProgramProfile | null {
    const saved = localStorage.getItem('userProgramProfile');
    if (saved) {
      return JSON.parse(saved);
    }

    // Try to convert from workout profile
    const workoutProfile = localStorage.getItem('userWorkoutProfile');
    if (workoutProfile) {
      const converted = this.workoutToProgram(JSON.parse(workoutProfile));
      this.saveProgramProfile(converted);
      return converted;
    }

    return null;
  }
}
