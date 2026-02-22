/**
 * Diet Plan Card Component
 * 
 * Card component for displaying diet plan summary information in lists.
 * Shows key details like plan type, duration, calories, and restrictions.
 * 
 * Requirements: 2.3
 */

'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { DietPlan } from '../../types';
import { DietPlanService } from '../../lib/dietPlanService';

interface DietPlanCardProps {
  plan: DietPlan;
  onView?: (planId: string) => void;
  onEdit?: (planId: string) => void;
  onDelete?: (planId: string) => void;
  className?: string;
}

export function DietPlanCard({ 
  plan, 
  onView, 
  onEdit, 
  onDelete, 
  className = '' 
}: DietPlanCardProps) {
  const nutritionSummary = DietPlanService.calculateNutritionSummary(plan);
  const planTypeDisplay = DietPlanService.getPlanTypeDisplayName(plan.planType);
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPlanTypeColor = (planType: DietPlan['planType']) => {
    const colors = {
      weight_loss: 'bg-red-100 text-red-800',
      muscle_gain: 'bg-green-100 text-green-800',
      maintenance: 'bg-blue-100 text-blue-800',
      endurance: 'bg-purple-100 text-purple-800'
    };
    return colors[planType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanTypeColor(plan.planType)}`}>
                {planTypeDisplay}
              </span>
              <span className="text-sm text-gray-500">
                {plan.duration} days
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Generated {formatDate(plan.generatedAt)}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {nutritionSummary.averageDailyCalories} cal/day
            </div>
            <div className="text-sm text-gray-600">
              Average daily calories
            </div>
          </div>
        </div>

        {/* Macronutrient Breakdown */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Daily Macros (avg)</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {nutritionSummary.averageMacros.protein}g
              </div>
              <div className="text-xs text-gray-600">Protein</div>
              <div className="text-xs text-gray-500">
                {nutritionSummary.macroPercentages.protein}%
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {nutritionSummary.averageMacros.carbohydrates}g
              </div>
              <div className="text-xs text-gray-600">Carbs</div>
              <div className="text-xs text-gray-500">
                {nutritionSummary.macroPercentages.carbohydrates}%
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {nutritionSummary.averageMacros.fats}g
              </div>
              <div className="text-xs text-gray-600">Fats</div>
              <div className="text-xs text-gray-500">
                {nutritionSummary.macroPercentages.fats}%
              </div>
            </div>
          </div>
        </div>

        {/* Dietary Restrictions */}
        {plan.restrictions.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</h4>
            <div className="flex flex-wrap gap-1">
              {plan.restrictions.map((restriction) => (
                <span
                  key={restriction}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {DietPlanService.getDietaryRestrictionDisplayName(restriction)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meal Count */}
        <div className="mb-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{plan.meals.length}</span> days planned • 
            <span className="font-medium ml-1">
              {plan.meals.reduce((total, day) => total + (3 + day.meals.snacks.length), 0)}
            </span> total meals
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(plan.id)}
              className="flex-1"
            >
              View Plan
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(plan.id)}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(plan.id)}
              className="text-red-600 hover:text-red-700 hover:border-red-300"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}