/**
 * Diet Plan Generator Component
 * 
 * Form component for generating personalized diet plans based on user metrics,
 * fitness goals, and dietary preferences.
 * 
 * Requirements: 2.1
 */

'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { CalorieCalculationPreview } from './CalorieCalculationPreview';
import { useDietPlan, useDietPlanGeneration } from '../../hooks/useDietPlan';
import { useUserProfile } from '../../hooks/useUserProfile';
import { DietaryRestriction } from '../../types';
import { DietPlanService } from '../../lib/dietPlanService';

interface DietPlanGeneratorProps {
  readonly onPlanGenerated?: (planId: string) => void;
  readonly className?: string;
}

export function DietPlanGenerator({ onPlanGenerated, className = '' }: DietPlanGeneratorProps) {
  const { userProfile } = useUserProfile();
  const { generatePlan, loading, error } = useDietPlan();
  const { 
    formData, 
    validationErrors, 
    updateFormData, 
    validateForm, 
    resetForm 
  } = useDietPlanGeneration();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Initialize form with user profile data if available
  React.useEffect(() => {
    if (userProfile?.personalMetrics) {
      updateFormData({
        personalMetrics: userProfile.personalMetrics
      });
    }
  }, [userProfile, updateFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const plan = await generatePlan(formData);
      onPlanGenerated?.(plan.id);
      resetForm();
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to generate diet plan:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              i + 1 <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`w-12 h-1 mx-2 ${
                i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderPersonalMetrics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Personal Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height (cm)
          </label>
          <Input
            type="number"
            value={formData.personalMetrics.height}
            onChange={(e) => updateFormData({
              personalMetrics: {
                ...formData.personalMetrics,
                height: parseInt(e.target.value) || 0
              }
            })}
            min="100"
            max="250"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <Input
            type="number"
            value={formData.personalMetrics.weight}
            onChange={(e) => updateFormData({
              personalMetrics: {
                ...formData.personalMetrics,
                weight: parseInt(e.target.value) || 0
              }
            })}
            min="30"
            max="300"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age
          </label>
          <Input
            type="number"
            value={formData.personalMetrics.age}
            onChange={(e) => updateFormData({
              personalMetrics: {
                ...formData.personalMetrics,
                age: parseInt(e.target.value) || 0
              }
            })}
            min="13"
            max="120"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            value={formData.personalMetrics.gender}
            onChange={(e) => updateFormData({
              personalMetrics: {
                ...formData.personalMetrics,
                gender: e.target.value as 'male' | 'female' | 'other'
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Activity Level
        </label>
        <select
          value={formData.personalMetrics.activityLevel}
          onChange={(e) => updateFormData({
            personalMetrics: {
              ...formData.personalMetrics,
              activityLevel: e.target.value as any
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="sedentary">Sedentary (little or no exercise)</option>
          <option value="light">Light (light exercise 1-3 days/week)</option>
          <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
          <option value="active">Active (hard exercise 6-7 days/week)</option>
          <option value="very_active">Very Active (very hard exercise & physical job)</option>
        </select>
      </div>
    </div>
  );

  const renderGoalsAndPlan = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Goals & Plan Type</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plan Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: 'weight_loss', label: 'Weight Loss', description: 'Caloric deficit (-500 kcal) for fat loss' },
            { value: 'muscle_gain', label: 'Muscle Gain', description: 'Caloric surplus (+300 kcal) for muscle building' },
            { value: 'maintenance', label: 'Maintenance', description: 'Maintain current weight (0 kcal adjustment)' },
            { value: 'endurance', label: 'Endurance', description: 'Extra fuel (+400 kcal) for endurance activities' }
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.planType === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="planType"
                value={option.value}
                checked={formData.planType === option.value}
                onChange={(e) => updateFormData({ planType: e.target.value as any })}
                className="mt-1 mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Show calorie calculation preview */}
      <CalorieCalculationPreview
        personalMetrics={formData.personalMetrics}
        planType={formData.planType}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Plan Duration (days)
        </label>
        <Input
          type="number"
          value={formData.duration}
          onChange={(e) => updateFormData({ duration: parseInt(e.target.value) || 7 })}
          min="1"
          max="365"
          required
        />
        <p className="text-sm text-gray-600 mt-1">
          Recommended: 7-14 days for initial plans
        </p>
      </div>
    </div>
  );

  const renderDietaryRestrictions = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Dietary Restrictions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
          'nut-free', 'low-carb', 'keto', 'paleo'
        ].map((restriction) => (
          <label
            key={restriction}
            className="flex items-center p-3 border rounded-lg cursor-pointer hover:border-gray-300"
          >
            <input
              type="checkbox"
              checked={formData.restrictions?.includes(restriction as DietaryRestriction) || false}
              onChange={(e) => {
                const currentRestrictions = formData.restrictions || [];
                if (e.target.checked) {
                  updateFormData({
                    restrictions: [...currentRestrictions, restriction as DietaryRestriction]
                  });
                } else {
                  updateFormData({
                    restrictions: currentRestrictions.filter(r => r !== restriction)
                  });
                }
              }}
              className="mr-3"
            />
            <span className="font-medium">
              {DietPlanService.getDietaryRestrictionDisplayName(restriction as DietaryRestriction)}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meals per Day
          </label>
          <select
            value={formData.preferences?.mealsPerDay || 3}
            onChange={(e) => updateFormData({
              preferences: {
                ...formData.preferences,
                mealsPerDay: parseInt(e.target.value)
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={3}>3 meals</option>
            <option value={4}>4 meals</option>
            <option value={5}>5 meals</option>
            <option value={6}>6 meals</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Snacks per Day
          </label>
          <select
            value={formData.preferences?.snacksPerDay || 1}
            onChange={(e) => updateFormData({
              preferences: {
                ...formData.preferences,
                snacksPerDay: parseInt(e.target.value)
              }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>No snacks</option>
            <option value={1}>1 snack</option>
            <option value={2}>2 snacks</option>
            <option value={3}>3 snacks</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cooking Time Preference
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'quick', label: 'Quick', description: '< 15 minutes' },
            { value: 'moderate', label: 'Moderate', description: '15-30 minutes' },
            { value: 'elaborate', label: 'Elaborate', description: '> 30 minutes' }
          ].map((option) => (
            <label
              key={option.value}
              className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.preferences?.cookingTime === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="cookingTime"
                value={option.value}
                checked={formData.preferences?.cookingTime === option.value}
                onChange={(e) => updateFormData({
                  preferences: {
                    ...formData.preferences,
                    cookingTime: e.target.value as any
                  }
                })}
                className="mb-2"
              />
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonalMetrics();
      case 2:
        return renderGoalsAndPlan();
      case 3:
        return renderDietaryRestrictions();
      case 4:
        return renderPreferences();
      default:
        return null;
    }
  };

  return (
    <Card className={`max-w-4xl mx-auto ${className}`}>
      <div className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Generate Your Personalized Diet Plan
          </h2>
          <p className="text-gray-600">
            Answer a few questions to get a customized meal plan tailored to your goals
          </p>
        </div>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit}>
          {renderCurrentStep()}

          {validationErrors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Please fix the following errors:
              </h4>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex space-x-3">
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Generating Plan...' : 'Generate Diet Plan'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}