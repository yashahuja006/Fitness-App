'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { calculateNutritionProfile } from '../../lib/nutritionCalculationService';
import { PersonalMetrics } from '../../types';

interface CalorieCalculationPreviewProps {
  readonly personalMetrics: PersonalMetrics;
  readonly planType: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'endurance';
  readonly className?: string;
}

export function CalorieCalculationPreview({ 
  personalMetrics, 
  planType, 
  className = '' 
}: CalorieCalculationPreviewProps) {
  // Only show preview if we have complete metrics
  const hasCompleteMetrics = personalMetrics.height > 0 && 
                            personalMetrics.weight > 0 && 
                            personalMetrics.age > 0;

  if (!hasCompleteMetrics) {
    return null;
  }

  try {
    const nutritionProfile = calculateNutritionProfile(personalMetrics, planType);
    const { calorieRequirements, macronutrients, bmi, bmiCategory } = nutritionProfile;

    const getGoalDescription = (goal: string) => {
      switch (goal) {
        case 'weight_loss':
          return { text: 'Weight Loss', adjustment: '-500 kcal', color: 'text-red-600' };
        case 'muscle_gain':
          return { text: 'Muscle Gain', adjustment: '+300 kcal', color: 'text-green-600' };
        case 'maintenance':
          return { text: 'Maintenance', adjustment: '0 kcal', color: 'text-blue-600' };
        case 'endurance':
          return { text: 'Endurance', adjustment: '+400 kcal', color: 'text-purple-600' };
        default:
          return { text: 'Unknown', adjustment: '0 kcal', color: 'text-gray-600' };
      }
    };

    const goalInfo = getGoalDescription(planType);

    const getBMIColor = (category: string) => {
      switch (category) {
        case 'underweight':
          return 'text-blue-600';
        case 'normal':
          return 'text-green-600';
        case 'overweight':
          return 'text-yellow-600';
        case 'obese':
          return 'text-red-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <Card className={`bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ${className}`}>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            📊 Your Calorie Calculation Preview
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Basic Metrics */}
            <div className="space-y-3">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Basic Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">BMI:</span>
                  <span className={`font-medium ${getBMIColor(bmiCategory)}`}>
                    {bmi} ({bmiCategory})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">BMR:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {calorieRequirements.bmr} kcal/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">TDEE:</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {calorieRequirements.tdee} kcal/day
                  </span>
                </div>
              </div>
            </div>

            {/* Goal Adjustment */}
            <div className="space-y-3">
              <h4 className="font-medium text-blue-800 dark:text-blue-200">Goal Adjustment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Goal:</span>
                  <span className={`font-medium ${goalInfo.color}`}>
                    {goalInfo.text}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Adjustment:</span>
                  <span className={`font-medium ${goalInfo.color}`}>
                    {goalInfo.adjustment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700 dark:text-blue-300">Target Calories:</span>
                  <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                    {calorieRequirements.targetCalories} kcal/day
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Macronutrient Breakdown */}
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
              Daily Macronutrient Targets
            </h4>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white dark:bg-blue-800 rounded-lg p-3">
                <div className="text-lg font-bold text-red-600">{macronutrients.protein}g</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Protein</div>
              </div>
              <div className="bg-white dark:bg-blue-800 rounded-lg p-3">
                <div className="text-lg font-bold text-green-600">{macronutrients.carbohydrates}g</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Carbs</div>
              </div>
              <div className="bg-white dark:bg-blue-800 rounded-lg p-3">
                <div className="text-lg font-bold text-yellow-600">{macronutrients.fats}g</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Fats</div>
              </div>
              <div className="bg-white dark:bg-blue-800 rounded-lg p-3">
                <div className="text-lg font-bold text-purple-600">{macronutrients.fiber}g</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Fiber</div>
              </div>
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
            <details className="text-sm">
              <summary className="font-medium text-blue-800 dark:text-blue-200 cursor-pointer">
                🧮 How we calculated this
              </summary>
              <div className="mt-2 space-y-2 text-blue-700 dark:text-blue-300">
                <div>
                  <strong>BMR (Mifflin-St Jeor):</strong> {personalMetrics.gender === 'male' ? 'Male' : 'Female'} formula
                </div>
                <div className="text-xs font-mono bg-white dark:bg-blue-800 p-2 rounded">
                  {personalMetrics.gender === 'male' 
                    ? `(10 × ${personalMetrics.weight}) + (6.25 × ${personalMetrics.height}) – (5 × ${personalMetrics.age}) + 5 = ${calorieRequirements.bmr} kcal`
                    : `(10 × ${personalMetrics.weight}) + (6.25 × ${personalMetrics.height}) – (5 × ${personalMetrics.age}) – 161 = ${calorieRequirements.bmr} kcal`
                  }
                </div>
                <div>
                  <strong>TDEE:</strong> BMR × Activity Multiplier ({personalMetrics.activityLevel})
                </div>
                <div>
                  <strong>Target:</strong> TDEE {goalInfo.adjustment} = {calorieRequirements.targetCalories} kcal
                </div>
              </div>
            </details>
          </div>
        </div>
      </Card>
    );
  } catch (error) {
    console.error('Error calculating nutrition profile:', error);
    return (
      <Card className={`bg-red-50 border-red-200 ${className}`}>
        <div className="p-4">
          <p className="text-red-700 text-sm">
            Unable to calculate calorie requirements. Please check your inputs.
          </p>
        </div>
      </Card>
    );
  }
}