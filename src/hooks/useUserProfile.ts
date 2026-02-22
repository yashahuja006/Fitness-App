import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/types/auth';

export const useUserProfile = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    setLoading(true);
    setError(null);

    try {
      await updateUserProfile(updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = (): boolean => {
    if (!userProfile) return false;

    const { personalMetrics } = userProfile;
    return !!(
      personalMetrics.height &&
      personalMetrics.weight &&
      personalMetrics.age &&
      personalMetrics.gender &&
      personalMetrics.activityLevel
    );
  };

  const calculateBMI = (): number | null => {
    if (!userProfile?.personalMetrics.height || !userProfile?.personalMetrics.weight) {
      return null;
    }

    const heightInMeters = userProfile.personalMetrics.height / 100;
    return userProfile.personalMetrics.weight / (heightInMeters * heightInMeters);
  };

  const getBMICategory = (): string | null => {
    const bmi = calculateBMI();
    if (!bmi) return null;

    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  return {
    user,
    userProfile,
    loading,
    error,
    updateProfile,
    isProfileComplete: isProfileComplete(),
    bmi: calculateBMI(),
    bmiCategory: getBMICategory(),
  };
};