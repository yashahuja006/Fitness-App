/**
 * Test utilities for the fitness app
 * Provides common testing helpers and utilities
 */

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '@/contexts/AuthContext';
import type { User } from '@/types';

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Creates a mock user for testing
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  personalMetrics: {
    height: 175,
    weight: 70,
    age: 30,
    gender: 'male',
    activityLevel: 'moderate',
    fitnessGoals: ['weight_loss', 'muscle_gain'],
  },
  preferences: {
    units: 'metric',
    theme: 'light',
    notifications: {
      workoutReminders: true,
      progressUpdates: true,
      systemUpdates: false,
      emailNotifications: true,
    },
    privacy: {
      profileVisibility: 'public',
      shareProgress: true,
      allowLeaderboards: true,
    },
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

// ============================================================================
// Custom Render Functions
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAuthState?: {
    user: User | null;
    loading: boolean;
  };
}

/**
 * Custom render function with providers
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { initialAuthState, ...renderOptions } = options;

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
};

// ============================================================================
// Mock Functions
// ============================================================================

/**
 * Creates a mock function that resolves after a delay
 */
export function createDelayedMock<T>(
  returnValue: T,
  delay = 100
): jest.MockedFunction<() => Promise<T>> {
  return jest.fn().mockImplementation(
    () => new Promise(resolve => setTimeout(() => resolve(returnValue), delay))
  );
}

/**
 * Creates a mock function that rejects after a delay
 */
export function createRejectedMock(
  error: Error,
  delay = 100
): jest.MockedFunction<() => Promise<never>> {
  return jest.fn().mockImplementation(
    () => new Promise((_, reject) => setTimeout(() => reject(error), delay))
  );
}

// Re-export everything from React Testing Library for convenience
export * from '@testing-library/react';
export { userEvent };