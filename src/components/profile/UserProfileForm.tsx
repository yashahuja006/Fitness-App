'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserProfile } from '@/types/auth';
import { validateUserProfile, sanitizeFormData, ValidationError } from '@/utils/validation';

interface UserProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { userProfile, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName,
        personalMetrics: { ...userProfile.personalMetrics },
        preferences: { ...userProfile.preferences },
      });
    }
  }, [userProfile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...((prev as any)[section] || {}),
          [field]: type === 'checkbox' ? checked : 
                   type === 'number' ? parseFloat(value) || 0 : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : 
                type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }

    // Clear errors when user starts typing
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const handleFitnessGoalsChange = (goal: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      personalMetrics: {
        ...prev.personalMetrics!,
        fitnessGoals: checked
          ? [...(prev.personalMetrics?.fitnessGoals || []), goal]
          : (prev.personalMetrics?.fitnessGoals || []).filter(g => g !== goal),
      },
    }));

    // Clear errors when user makes changes
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setValidationErrors([]);

    try {
      // Sanitize form data
      const sanitizedData = sanitizeFormData(formData);
      
      // Validate the data
      const validation = validateUserProfile(sanitizedData);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setError('Please correct the errors below before submitting.');
        return;
      }

      await updateUserProfile(sanitizedData);
      setSuccessMessage('Profile updated successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error?.message;
  };

  const fitnessGoalOptions = [
    'Weight Loss',
    'Muscle Gain',
    'Endurance',
    'Strength',
    'Flexibility',
    'General Fitness',
    'Sports Performance',
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Basic Information
          </h3>
          
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name *
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName || ''}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                getFieldError('displayName') 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            />
            {getFieldError('displayName') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError('displayName')}
              </p>
            )}
          </div>
        </div>

        {/* Personal Metrics */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Personal Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="personalMetrics.height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Height (cm) *
              </label>
              <input
                id="personalMetrics.height"
                name="personalMetrics.height"
                type="number"
                min="50"
                max="300"
                step="0.1"
                value={formData.personalMetrics?.height || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  getFieldError('height') 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {getFieldError('height') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {getFieldError('height')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="personalMetrics.weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Weight (kg) *
              </label>
              <input
                id="personalMetrics.weight"
                name="personalMetrics.weight"
                type="number"
                min="20"
                max="500"
                step="0.1"
                value={formData.personalMetrics?.weight || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  getFieldError('weight') 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {getFieldError('weight') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {getFieldError('weight')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="personalMetrics.age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Age *
              </label>
              <input
                id="personalMetrics.age"
                name="personalMetrics.age"
                type="number"
                min="13"
                max="120"
                value={formData.personalMetrics?.age || ''}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  getFieldError('age') 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              />
              {getFieldError('age') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {getFieldError('age')}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="personalMetrics.gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender *
              </label>
              <select
                id="personalMetrics.gender"
                name="personalMetrics.gender"
                value={formData.personalMetrics?.gender || 'other'}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                  getFieldError('gender') 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {getFieldError('gender') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {getFieldError('gender')}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="personalMetrics.activityLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Activity Level *
            </label>
            <select
              id="personalMetrics.activityLevel"
              name="personalMetrics.activityLevel"
              value={formData.personalMetrics?.activityLevel || ''}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                getFieldError('activityLevel') 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="light">Light (light exercise 1-3 days/week)</option>
              <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
              <option value="active">Active (hard exercise 6-7 days/week)</option>
              <option value="very_active">Very Active (very hard exercise, physical job)</option>
            </select>
            {getFieldError('activityLevel') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError('activityLevel')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Fitness Goals * (Select at least one)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {fitnessGoalOptions.map((goal) => (
                <label key={goal} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.personalMetrics?.fitnessGoals?.includes(goal) || false}
                    onChange={(e) => handleFitnessGoalsChange(goal, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {goal}
                  </span>
                </label>
              ))}
            </div>
            {getFieldError('fitnessGoals') && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {getFieldError('fitnessGoals')}
              </p>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Preferences
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="preferences.units" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Units
              </label>
              <select
                id="preferences.units"
                name="preferences.units"
                value={formData.preferences?.units || 'metric'}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="metric">Metric</option>
                <option value="imperial">Imperial</option>
              </select>
            </div>

            <div>
              <label htmlFor="preferences.theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme
              </label>
              <select
                id="preferences.theme"
                name="preferences.theme"
                value={formData.preferences?.theme || 'auto'}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {validationErrors.length > 0 && !error && (
          <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
            <p className="font-medium mb-2">Please correct the following errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err, index) => (
                <li key={index}>{err.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};