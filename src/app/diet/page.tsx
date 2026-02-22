/**
 * Diet Plan Page
 * 
 * Next.js page for the diet plan functionality.
 * Provides the main interface for diet plan generation and management.
 * 
 * Requirements: 2.1, 2.3
 */

'use client';

import React from 'react';
import { DietPlanPage } from '../../components/diet/DietPlanPage';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { Navigation } from '../../components/ui/Navigation';

export default function DietPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <DietPlanPage />
      </div>
    </ProtectedRoute>
  );
}