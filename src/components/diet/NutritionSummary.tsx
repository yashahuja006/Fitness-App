/**
 * Nutrition Summary Component
 * 
 * Component for displaying comprehensive nutrition information for a diet plan
 * including calories, macronutrients, and visual representations.
 * 
 * Requirements: 2.5
 */

'use client';

import React from 'react';
import { DietPlan } from '../../types';
import { useDietPlanNutrition } from '../../hooks/useDietPlan';

interface NutritionSummaryProps {
  plan: DietPlan;
  showDetailed?: boolean;
  className?: string;
}

export function NutritionSummary({ 
  plan, 
  showDetailed = true, 
  className = '' 
}: NutritionSummaryProps) {
  const { nutritionSummary } = useDietPlanNutrition(plan);

  if (!nutritionSummary) {
    return (
      <div className={`text-center text-gray-500 ${className}`}>
        No nutrition data available
      </div>
    );
  }

  const MacroBar = ({ 
    label, 
    value, 
    percentage, 
    color, 
    unit = 'g' 
  }: { 
    label: string; 
    value: number; 
    percentage: number; 
    color: string; 
    unit?: string; 
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900">
            {value}{unit}
          </span>
          <span className="text-xs text-gray-500 ml-1">
            ({percentage}%)
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {nutritionSummary.averageDailyCalories}
          </div>
          <div className="text-sm text-blue-700">Calories/day</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-900">
            {nutritionSummary.averageMacros.protein}g
          </div>
          <div className="text-sm text-green-700">Protein/day</div>
          <div className="text-xs text-green-600">
            {nutritionSummary.macroPercentages.protein}%
          </div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">
            {nutritionSummary.averageMacros.carbohydrates}g
          </div>
          <div className="text-sm text-yellow-700">Carbs/day</div>
          <div className="text-xs text-yellow-600">
            {nutritionSummary.macroPercentages.carbohydrates}%
          </div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-900">
            {nutritionSummary.averageMacros.fats}g
          </div>
          <div className="text-sm text-purple-700">Fats/day</div>
          <div className="text-xs text-purple-600">
            {nutritionSummary.macroPercentages.fats}%
          </div>
        </div>
      </div>

      {showDetailed && (
        <>
          {/* Macronutrient Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Daily Macronutrient Breakdown (Average)
            </h3>
            
            <div className="space-y-4">
              <MacroBar
                label="Protein"
                value={nutritionSummary.averageMacros.protein}
                percentage={nutritionSummary.macroPercentages.protein}
                color="bg-blue-600"
              />
              
              <MacroBar
                label="Carbohydrates"
                value={nutritionSummary.averageMacros.carbohydrates}
                percentage={nutritionSummary.macroPercentages.carbohydrates}
                color="bg-green-600"
              />
              
              <MacroBar
                label="Fats"
                value={nutritionSummary.averageMacros.fats}
                percentage={nutritionSummary.macroPercentages.fats}
                color="bg-yellow-600"
              />
              
              <MacroBar
                label="Fiber"
                value={nutritionSummary.averageMacros.fiber}
                percentage={Math.min((nutritionSummary.averageMacros.fiber / 35) * 100, 100)} // 35g is recommended daily fiber
                color="bg-purple-600"
              />
            </div>
          </div>

          {/* Calorie Distribution Pie Chart (Text-based) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Calorie Distribution
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Protein</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {Math.round(nutritionSummary.averageMacros.protein * 4)} cal
                  </div>
                  <div className="text-xs text-gray-600">
                    {nutritionSummary.macroPercentages.protein}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-600 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Carbs</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {Math.round(nutritionSummary.averageMacros.carbohydrates * 4)} cal
                  </div>
                  <div className="text-xs text-gray-600">
                    {nutritionSummary.macroPercentages.carbohydrates}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-600 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-700">Fats</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {Math.round(nutritionSummary.averageMacros.fats * 9)} cal
                  </div>
                  <div className="text-xs text-gray-600">
                    {nutritionSummary.macroPercentages.fats}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Nutrition Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Plan Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{plan.duration} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total meals:</span>
                  <span className="font-medium">
                    {plan.meals.reduce((total, day) => total + (3 + day.meals.snacks.length), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg meals/day:</span>
                  <span className="font-medium">
                    {Math.round((plan.meals.reduce((total, day) => total + (3 + day.meals.snacks.length), 0) / plan.duration) * 10) / 10}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Nutrition Goals</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Protein per kg:</span>
                  <span className="font-medium">
                    {/* This would need user weight from context */}
                    ~{Math.round((nutritionSummary.averageMacros.protein / 70) * 10) / 10}g/kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fiber goal:</span>
                  <span className="font-medium">
                    {nutritionSummary.averageMacros.fiber}g / 35g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan type:</span>
                  <span className="font-medium capitalize">
                    {plan.planType.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}