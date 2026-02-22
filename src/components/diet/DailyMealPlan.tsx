/**
 * Daily Meal Plan Component
 * 
 * Component for displaying a complete day's meal plan including
 * breakfast, lunch, dinner, and snacks with nutrition summary.
 * 
 * Requirements: 2.5
 */

'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { MealCard } from './MealCard';
import { DailyMealPlan as DailyMealPlanType, Meal } from '../../types';
import { useDietPlanNutrition } from '../../hooks/useDietPlan';

interface DailyMealPlanProps {
  dayPlan: DailyMealPlanType;
  onSubstituteMeal?: (mealType: string, meal: Meal) => void;
  showNutritionSummary?: boolean;
  className?: string;
}

export function DailyMealPlan({ 
  dayPlan, 
  onSubstituteMeal, 
  showNutritionSummary = true,
  className = '' 
}: DailyMealPlanProps) {
  const { getDayNutrition } = useDietPlanNutrition(null);
  const dayNutrition = getDayNutrition(dayPlan);

  const handleSubstitute = (mealType: string, meal: Meal) => {
    onSubstituteMeal?.(mealType, meal);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Day {dayPlan.day}
        </h2>
        
        {showNutritionSummary && (
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {dayNutrition.totalCalories} calories
            </div>
            <div className="text-sm text-gray-600">
              {dayNutrition.mealCount} meals
            </div>
          </div>
        )}
      </div>

      {/* Nutrition Summary */}
      {showNutritionSummary && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Daily Nutrition Summary</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {dayNutrition.totalCalories}
              </div>
              <div className="text-sm text-gray-600">Calories</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {dayPlan.macroBreakdown.protein}g
              </div>
              <div className="text-sm text-gray-600">Protein</div>
              <div className="text-xs text-gray-500">
                {dayNutrition.proteinPercentage}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {dayPlan.macroBreakdown.carbohydrates}g
              </div>
              <div className="text-sm text-gray-600">Carbs</div>
              <div className="text-xs text-gray-500">
                {dayNutrition.carbPercentage}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {dayPlan.macroBreakdown.fats}g
              </div>
              <div className="text-sm text-gray-600">Fats</div>
              <div className="text-xs text-gray-500">
                {dayNutrition.fatPercentage}%
              </div>
            </div>
          </div>

          {/* Macro Progress Bars */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Protein</span>
                <span className="text-gray-900">{dayNutrition.proteinPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(dayNutrition.proteinPercentage, 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Carbohydrates</span>
                <span className="text-gray-900">{dayNutrition.carbPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(dayNutrition.carbPercentage, 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Fats</span>
                <span className="text-gray-900">{dayNutrition.fatPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(dayNutrition.fatPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Meals */}
      <div className="space-y-4">
        {/* Breakfast */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Breakfast</h3>
          <MealCard
            meal={dayPlan.meals.breakfast}
            mealType="breakfast"
            onSubstitute={(meal) => handleSubstitute('breakfast', meal)}
          />
        </div>

        {/* Lunch */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Lunch</h3>
          <MealCard
            meal={dayPlan.meals.lunch}
            mealType="lunch"
            onSubstitute={(meal) => handleSubstitute('lunch', meal)}
          />
        </div>

        {/* Dinner */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Dinner</h3>
          <MealCard
            meal={dayPlan.meals.dinner}
            mealType="dinner"
            onSubstitute={(meal) => handleSubstitute('dinner', meal)}
          />
        </div>

        {/* Snacks */}
        {dayPlan.meals.snacks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Snacks ({dayPlan.meals.snacks.length})
            </h3>
            <div className="space-y-3">
              {dayPlan.meals.snacks.map((snack, index) => (
                <MealCard
                  key={`${snack.id}-${index}`}
                  meal={snack}
                  mealType="snack"
                  onSubstitute={(meal) => handleSubstitute('snacks', meal)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}