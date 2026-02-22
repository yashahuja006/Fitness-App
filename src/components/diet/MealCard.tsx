/**
 * Meal Card Component
 * 
 * Card component for displaying individual meal information including
 * ingredients, nutrition facts, and preparation instructions.
 * 
 * Requirements: 2.5
 */

'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Meal } from '../../types';
import { DietPlanService } from '../../lib/dietPlanService';

interface MealCardProps {
  meal: Meal;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onSubstitute?: (meal: Meal) => void;
  showDetails?: boolean;
  className?: string;
}

export function MealCard({ 
  meal, 
  mealType, 
  onSubstitute, 
  showDetails = false,
  className = '' 
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const mealDisplay = DietPlanService.formatMealForDisplay(meal);

  const getMealTypeIcon = (type: string) => {
    const icons = {
      breakfast: '🍳',
      lunch: '🥗',
      dinner: '🍽️',
      snack: '🍎'
    };
    return icons[type as keyof typeof icons] || '🍽️';
  };

  const getMealTypeColor = (type: string) => {
    const colors = {
      breakfast: 'bg-yellow-100 text-yellow-800',
      lunch: 'bg-green-100 text-green-800',
      dinner: 'bg-blue-100 text-blue-800',
      snack: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className={`${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getMealTypeIcon(mealType)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{meal.name}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(mealType)}`}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-semibold text-gray-900">{mealDisplay.calories}</div>
            <div className="text-xs text-gray-600">{mealDisplay.prepTime}</div>
          </div>
        </div>

        {/* Quick Nutrition Info */}
        <div className="mb-3">
          <div className="text-sm text-gray-600">{mealDisplay.macros}</div>
          <div className="text-xs text-gray-500 mt-1">
            {mealDisplay.ingredientCount} ingredients
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {/* Ingredients */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Ingredients</h4>
              <ul className="space-y-1">
                {meal.ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm text-gray-700 flex justify-between">
                    <span>{ingredient.name}</span>
                    <span className="text-gray-500">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
              <ol className="space-y-1">
                {meal.instructions.map((instruction, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    <span className="font-medium text-gray-500 mr-2">{index + 1}.</span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>

            {/* Detailed Nutrition */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Nutrition Facts</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Calories:</span>
                  <span className="font-medium">{meal.calories}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Protein:</span>
                  <span className="font-medium">{meal.macros.protein}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbs:</span>
                  <span className="font-medium">{meal.macros.carbohydrates}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fats:</span>
                  <span className="font-medium">{meal.macros.fats}g</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-gray-600">Fiber:</span>
                  <span className="font-medium">{meal.macros.fiber}g</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1"
          >
            {isExpanded ? 'Show Less' : 'Show Details'}
          </Button>
          
          {onSubstitute && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSubstitute(meal)}
              className="text-blue-600 hover:text-blue-700 hover:border-blue-300"
            >
              Substitute
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}