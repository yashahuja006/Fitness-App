'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PrivacySettings, NotificationSettings } from '@/types/auth';

interface PrivacySettingsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PrivacySettingsForm: React.FC<PrivacySettingsFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { userProfile, updateUserProfile } = useAuth();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'private',
    shareProgress: false,
    shareWorkouts: false,
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    workoutReminders: true,
    progressUpdates: true,
    socialUpdates: false,
    systemUpdates: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.preferences) {
      setPrivacySettings(userProfile.preferences.privacy);
      setNotificationSettings(userProfile.preferences.notifications);
    }
  }, [userProfile]);

  const handlePrivacyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setPrivacySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear messages when user makes changes
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleNotificationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked } = e.target;

    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked,
    }));

    // Clear messages when user makes changes
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updates = {
        preferences: {
          units: userProfile?.preferences?.units || 'metric',
          theme: userProfile?.preferences?.theme || 'auto',
          privacy: privacySettings,
          notifications: notificationSettings,
        },
      };

      await updateUserProfile(updates);
      setSuccessMessage('Privacy settings updated successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      setError('Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Privacy Settings */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Privacy Settings
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Control who can see your profile and fitness data.
            </p>
          </div>

          <div>
            <label htmlFor="profileVisibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Visibility
            </label>
            <select
              id="profileVisibility"
              name="profileVisibility"
              value={privacySettings.profileVisibility}
              onChange={handlePrivacyChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="public">Public - Anyone can see your profile</option>
              <option value="friends">Friends Only - Only your friends can see your profile</option>
              <option value="private">Private - Only you can see your profile</option>
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This controls who can view your basic profile information and achievements.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="shareProgress"
                  name="shareProgress"
                  type="checkbox"
                  checked={privacySettings.shareProgress}
                  onChange={handlePrivacyChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="shareProgress" className="font-medium text-gray-700 dark:text-gray-300">
                  Share Progress Data
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Allow others to see your workout progress, achievements, and fitness milestones.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="shareWorkouts"
                  name="shareWorkouts"
                  type="checkbox"
                  checked={privacySettings.shareWorkouts}
                  onChange={handlePrivacyChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="shareWorkouts" className="font-medium text-gray-700 dark:text-gray-300">
                  Share Workout Details
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Allow others to see your specific workouts, exercises, and training routines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Notification Preferences
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Choose what notifications you'd like to receive.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="workoutReminders"
                  name="workoutReminders"
                  type="checkbox"
                  checked={notificationSettings.workoutReminders}
                  onChange={handleNotificationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="workoutReminders" className="font-medium text-gray-700 dark:text-gray-300">
                  Workout Reminders
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Get reminded about scheduled workouts and exercise sessions.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="progressUpdates"
                  name="progressUpdates"
                  type="checkbox"
                  checked={notificationSettings.progressUpdates}
                  onChange={handleNotificationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="progressUpdates" className="font-medium text-gray-700 dark:text-gray-300">
                  Progress Updates
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Receive notifications about your fitness progress and achievements.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="socialUpdates"
                  name="socialUpdates"
                  type="checkbox"
                  checked={notificationSettings.socialUpdates}
                  onChange={handleNotificationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="socialUpdates" className="font-medium text-gray-700 dark:text-gray-300">
                  Social Updates
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Get notified about friend activities, challenges, and social interactions.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="systemUpdates"
                  name="systemUpdates"
                  type="checkbox"
                  checked={notificationSettings.systemUpdates}
                  onChange={handleNotificationChange}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="systemUpdates" className="font-medium text-gray-700 dark:text-gray-300">
                  System Updates
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Receive important system notifications, updates, and maintenance alerts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Data Management
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Manage your personal data and account settings.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Data Privacy Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    Your fitness data is encrypted and stored securely. You can request data export or account deletion at any time by contacting support.
                  </p>
                </div>
              </div>
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

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
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
            {loading ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};