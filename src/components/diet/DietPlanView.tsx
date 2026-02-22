/**
 * Diet Plan View Component
 * 
 * Complete view component for displaying a diet plan with all days,
 * meals, and nutrition information. Includes navigation between days
 * and meal substitution functionality.
 * 
 * Requirements: 2.3, 2.4, 2.5
 */

'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DailyMealPlan } from './DailyMealPlan';
import { NutritionSummary } from './NutritionSummary';
import { DietPlan, Meal } from '../../types';
import { useDietPlan } from '../../hooks/useDietPlan';
import { DietPlanService } from '../../lib/dietPlanService';

interface DietPlanViewProps {
  plan: DietPlan;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  className?: string;
}

export function DietPlanView({ 
  plan, 
  onEdit, 
  onDelete, 
  onBack, 
  className = '' 
}: DietPlanViewProps) {
  const [currentDay, setCurrentDay] = useState(1);
  const [showAllDays, setShowAllDays] = useState(false);
  const { substituteMeal, loading, error } = useDietPlan();

  const currentDayPlan = plan.meals.find(day => day.day === currentDay);
  const planTypeDisplay = DietPlanService.getPlanTypeDisplayName(plan.planType);

  const handleSubstituteMeal = async (mealType: string, meal: Meal) => {
    try {
      await substituteMeal(plan.id, currentDay, mealType, meal);
    } catch (error) {
      console.error('Failed to substitute meal:', error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {onBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                >
                  ← Back
                </Button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {planTypeDisplay} Diet Plan
              </h1>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{plan.duration} days</span>
              <span>•</span>
              <span>Generated {formatDate(plan.generatedAt)}</span>
              {plan.lastModified && new Date(plan.lastModified) > new Date(plan.generatedAt) && (
                <>
                  <span>•</span>
                  <span>Modified {formatDate(plan.lastModified)}</span>
                </>
              )}
            </div>

            {plan.restrictions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {plan.restrictions.map((restriction) => (
                  <span
                    key={restriction}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {DietPlanService.getDietaryRestrictionDisplayName(restriction)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={onEdit}
                disabled={loading}
              >
                Edit Plan
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                onClick={onDelete}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Delete Plan
              </Button>
            )}
          </div>
        </div>

        {/* Plan Overview */}
        <NutritionSummary plan={plan} />
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* Day Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Daily Meal Plans
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllDays(!showAllDays)}
            >
              {showAllDays ? 'Show Single Day' : 'Show All Days'}
            </Button>
          </div>
        </div>

        {!showAllDays && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
                disabled={currentDay === 1}
              >
                ← Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Day {currentDay} of {plan.duration}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDay(Math.min(plan.duration, currentDay + 1))}
                disabled={currentDay === plan.duration}
              >
                Next →
              </Button>
            </div>

            {/* Day Selector */}
            <select
              value={currentDay}
              onChange={(e) => setCurrentDay(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: plan.duration }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Day {i + 1}
                </option>
              ))}
            </select>
          </div>
        )}
      </Card>

      {/* Meal Plans */}
      {showAllDays ? (
        <div className="space-y-8">
          {plan.meals.map((dayPlan) => (
            <Card key={dayPlan.day} className="p-6">
              <DailyMealPlan
                dayPlan={dayPlan}
                onSubstituteMeal={handleSubstituteMeal}
                showNutritionSummary={true}
              />
            </Card>
          ))}
        </div>
      ) : (
        currentDayPlan && (
          <Card className="p-6">
            <DailyMealPlan
              dayPlan={currentDayPlan}
              onSubstituteMeal={handleSubstituteMeal}
              showNutritionSummary={true}
            />
          </Card>
        )
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Updating meal plan...</span>
          </div>
        </Card>
      )}
    </div>
  );
}