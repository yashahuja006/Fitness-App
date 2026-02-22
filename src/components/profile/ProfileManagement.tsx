'use client';

import React, { useState } from 'react';
import { UserProfileForm } from './UserProfileForm';
import { PrivacySettingsForm } from './PrivacySettingsForm';
import { useUserProfile } from '@/hooks/useUserProfile';

type TabType = 'profile' | 'privacy';

interface ProfileManagementProps {
  initialTab?: TabType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProfileManagement: React.FC<ProfileManagementProps> = ({
  initialTab = 'profile',
  onSuccess,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { userProfile, isProfileComplete, bmi, bmiCategory } = useUserProfile();

  const tabs = [
    {
      id: 'profile' as TabType,
      name: 'Profile Information',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'privacy' as TabType,
      name: 'Privacy & Notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  const handleTabSuccess = () => {
    // Show success message or handle success for the specific tab
    onSuccess?.();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile Management
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your personal information, fitness metrics, and privacy settings.
        </p>
      </div>

      {/* Profile Status Card */}
      {userProfile && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Profile Status
              </h3>
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    isProfileComplete ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isProfileComplete ? 'Profile Complete' : 'Profile Incomplete'}
                  </span>
                </div>
                {bmi && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    BMI: {bmi.toFixed(1)} ({bmiCategory})
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {userProfile.updatedAt ? new Date(userProfile.updatedAt).toLocaleDateString() : 'Never'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {activeTab === 'profile' && (
          <UserProfileForm
            onSuccess={handleTabSuccess}
            onCancel={onCancel}
          />
        )}
        {activeTab === 'privacy' && (
          <PrivacySettingsForm
            onSuccess={handleTabSuccess}
            onCancel={onCancel}
          />
        )}
      </div>
    </div>
  );
};