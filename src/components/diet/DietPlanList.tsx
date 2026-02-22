/**
 * Diet Plan List Component
 * 
 * Component for displaying a list of diet plans with filtering,
 * searching, and sorting capabilities.
 * 
 * Requirements: 2.3
 */

'use client';

import React, { useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { DietPlanCard } from './DietPlanCard';
import { useDietPlan, useDietPlanFilters } from '../../hooks/useDietPlan';
import { DietPlan } from '../../types';

interface DietPlanListProps {
  onViewPlan?: (planId: string) => void;
  onEditPlan?: (planId: string) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function DietPlanList({ 
  onViewPlan, 
  onEditPlan, 
  onCreateNew, 
  className = '' 
}: DietPlanListProps) {
  const { 
    plans, 
    loading, 
    error, 
    loadUserPlans, 
    deletePlan, 
    clearError 
  } = useDietPlan();

  const {
    filters,
    filteredPlans,
    updateFilters,
    clearFilters
  } = useDietPlanFilters(plans);

  // Load plans on component mount (only if user is authenticated)
  useEffect(() => {
    // Only auto-load if we have authentication context
    // This prevents errors when backend is not available
    const hasAuth = typeof window !== 'undefined' && 
      (localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
    
    if (hasAuth) {
      loadUserPlans();
    }
  }, [loadUserPlans]);

  const handleDeletePlan = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this diet plan? This action cannot be undone.')) {
      try {
        await deletePlan(planId);
      } catch (error) {
        console.error('Failed to delete plan:', error);
      }
    }
  };

  const EmptyState = () => (
    <Card className="p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Diet Plans Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Create your first personalized diet plan to get started on your nutrition journey.
        </p>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            Create Your First Diet Plan
          </Button>
        )}
      </div>
    </Card>
  );

  const LoadingState = () => (
    <Card className="p-8">
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading your diet plans...</span>
      </div>
    </Card>
  );

  const ErrorState = () => (
    <Card className="p-6 bg-red-50 border-red-200">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Error Loading Diet Plans
          </h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            clearError();
            loadUserPlans();
          }}
          className="text-red-600 hover:text-red-700 hover:border-red-300"
        >
          Retry
        </Button>
      </div>
    </Card>
  );

  if (loading && plans.length === 0) {
    return <LoadingState />;
  }

  if (error && plans.length === 0) {
    return <ErrorState />;
  }

  if (plans.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Diet Plans</h1>
          <p className="text-gray-600 mt-1">
            {plans.length} plan{plans.length !== 1 ? 's' : ''} created
          </p>
        </div>
        
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            Create New Plan
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <Input
              type="text"
              placeholder="Search diet plans..."
              value={filters.searchTerm}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
            />
          </div>

          {/* Plan Type Filter */}
          <div>
            <select
              value={filters.planType}
              onChange={(e) => updateFilters({ 
                planType: e.target.value as DietPlan['planType'] | '' 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Plan Types</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="maintenance">Maintenance</option>
              <option value="endurance">Endurance</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilters({ 
                sortBy: e.target.value as 'newest' | 'oldest' | 'name' 
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">By Plan Type</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.searchTerm || filters.planType) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-gray-600">Active filters:</span>
            
            {filters.searchTerm && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Search: "{filters.searchTerm}"
              </span>
            )}
            
            {filters.planType && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Type: {filters.planType.replace('_', ' ')}
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearError}
              className="text-red-600 hover:text-red-700"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {filteredPlans.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Plans Found
            </h3>
            <p className="text-gray-600 mb-4">
              No diet plans match your current filters. Try adjusting your search criteria.
            </p>
            <Button
              variant="outline"
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredPlans.length} of {plans.length} plan{plans.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <DietPlanCard
                  key={plan.id}
                  plan={plan}
                  onView={onViewPlan}
                  onEdit={onEditPlan}
                  onDelete={handleDeletePlan}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <Card className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Updating...</span>
          </div>
        </Card>
      )}
    </div>
  );
}