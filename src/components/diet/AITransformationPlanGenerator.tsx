/**
 * AI Transformation Plan Generator
 * 
 * Advanced diet plan generator using the AI Performance Nutrition Engine
 * with metabolic analysis, macro intelligence, and progressive programming.
 */

'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { 
  generateTransformationPlan, 
  TransformationPlan, 
  TransformationPlanInput 
} from '../../lib/aiNutritionEngine';
import { AdvancedPersonalMetrics } from '../../lib/advancedMetabolicAnalysis';

interface AITransformationPlanGeneratorProps {
  readonly onPlanGenerated?: (plan: TransformationPlan) => void;
  readonly className?: string;
}

export function AITransformationPlanGenerator({ 
  onPlanGenerated, 
  className = '' 
}: AITransformationPlanGeneratorProps) {
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<TransformationPlan | null>(null);
  
  const [formData, setFormData] = useState<TransformationPlanInput>({
    personalMetrics: {
      height: 0,
      weight: 0,
      age: 0,
      gender: 'male',
      activityLevel: 'moderate',
      bodyFatPercentage: undefined,
      trainingDaysPerWeek: 3,
      subscriptionTier: 'free'
    } as AdvancedPersonalMetrics,
    goal: 'fat_loss',
    dietType: 'standard',
    planDurationWeeks: 8,
    subscriptionTier: 'free'
  });

  const totalSteps = 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const plan = generateTransformationPlan(formData);
      setGeneratedPlan(plan);
      onPlanGenerated?.(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate transformation plan');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<TransformationPlanInput>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const updatePersonalMetrics = (updates: Partial<AdvancedPersonalMetrics>) => {
    setFormData(prev => ({
      ...prev,
      personalMetrics: { ...prev.personalMetrics, ...updates }
    }));
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
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
              i + 1 <= currentStep
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`w-16 h-1 mx-2 ${
                i + 1 < currentStep 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                  : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderPersonalMetrics = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🧬 Advanced Metabolic Analysis
        </h3>
        <p className="text-gray-600">
          Provide your metrics for precise BMR and body composition analysis
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Height (cm) *
          </label>
          <Input
            type="number"
            value={formData.personalMetrics.height || ''}
            onChange={(e) => updatePersonalMetrics({
              height: Number.parseInt(e.target.value) || 0
            })}
            min="100"
            max="250"
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg) *
          </label>
          <Input
            type="number"
            value={formData.personalMetrics.weight || ''}
            onChange={(e) => updatePersonalMetrics({
              weight: Number.parseInt(e.target.value) || 0
            })}
            min="30"
            max="300"
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age *
          </label>
          <Input
            type="number"
            value={formData.personalMetrics.age || ''}
            onChange={(e) => updatePersonalMetrics({
              age: Number.parseInt(e.target.value) || 0
            })}
            min="13"
            max="120"
            required
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            value={formData.personalMetrics.gender}
            onChange={(e) => updatePersonalMetrics({
              gender: e.target.value as 'male' | 'female' | 'other'
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Body Fat % (optional)
          </label>
          <Input
            type="number"
            value={formData.personalMetrics.bodyFatPercentage || ''}
            onChange={(e) => updatePersonalMetrics({
              bodyFatPercentage: e.target.value ? Number.parseFloat(e.target.value) : undefined
            })}
            min="3"
            max="50"
            step="0.1"
            className="w-full"
            placeholder="Leave empty to estimate"
          />
          <p className="text-xs text-gray-500 mt-1">
            More accurate calculations with body fat data
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Training Days/Week
          </label>
          <select
            value={formData.personalMetrics.trainingDaysPerWeek || 3}
            onChange={(e) => updatePersonalMetrics({
              trainingDaysPerWeek: Number.parseInt(e.target.value)
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map(days => (
              <option key={days} value={days}>
                {days} {days === 1 ? 'day' : 'days'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Activity Level *
        </label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
            { value: 'light', label: 'Light', desc: 'Light exercise 1-3 days/week' },
            { value: 'moderate', label: 'Moderate', desc: 'Moderate exercise 3-5 days/week' },
            { value: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
            { value: 'very_active', label: 'Very Active', desc: 'Very hard exercise & physical job' }
          ].map((option) => (
            <label
              key={option.value}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                formData.personalMetrics.activityLevel === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="activityLevel"
                value={option.value}
                checked={formData.personalMetrics.activityLevel === option.value}
                onChange={(e) => updatePersonalMetrics({
                  activityLevel: e.target.value as any
                })}
                className="mr-3"
              />
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGoalSelection = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🎯 Transformation Goal
        </h3>
        <p className="text-gray-600">
          Choose your primary goal for personalized programming
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { 
            value: 'fat_loss', 
            label: 'Fat Loss', 
            icon: '🔥',
            description: '20% deficit with progressive tapering and refeed strategies',
            features: ['Plateau prevention', 'Refeed scheduling', 'Muscle preservation']
          },
          { 
            value: 'muscle_gain', 
            label: 'Muscle Gain', 
            icon: '💪',
            description: '15% surplus with progressive adjustments for optimal growth',
            features: ['Lean bulk approach', 'Progress tracking', 'Minimal fat gain']
          },
          { 
            value: 'recomposition', 
            label: 'Body Recomposition', 
            icon: '⚖️',
            description: 'Simultaneous fat loss and muscle gain with cycling strategies',
            features: ['Calorie cycling', 'Training optimization', 'Patient approach']
          },
          { 
            value: 'endurance', 
            label: 'Endurance Performance', 
            icon: '🏃',
            description: 'Carb-focused nutrition for sustained energy and recovery',
            features: ['Glycogen optimization', 'Recovery nutrition', 'Performance fuel']
          }
        ].map((option) => (
          <label
            key={option.value}
            className={`flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${
              formData.goal === option.value
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <input
              type="radio"
              name="goal"
              value={option.value}
              checked={formData.goal === option.value}
              onChange={(e) => updateFormData({ goal: e.target.value as any })}
              className="sr-only"
            />
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">{option.icon}</div>
              <div className="font-bold text-lg text-gray-900">{option.label}</div>
            </div>
            <div className="text-sm text-gray-600 mb-4 text-center">
              {option.description}
            </div>
            <div className="space-y-1">
              {option.features.map((feature, index) => (
                <div key={index} className="flex items-center text-xs text-gray-500">
                  <div className="w-1 h-1 bg-blue-500 rounded-full mr-2"></div>
                  {feature}
                </div>
              ))}
            </div>
          </label>
        ))}
      </div>
    </div>
  );

  if (generatedPlan) {
    return (
      <Card className={`max-w-6xl mx-auto ${className}`}>
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🚀 Your AI Transformation Plan
            </h2>
            <p className="text-gray-600">
              Personalized nutrition and progression strategy
            </p>
          </div>

          {/* Plan Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">Metabolic Analysis</h3>
              <div className="space-y-1 text-sm">
                <div>BMR: {generatedPlan.metabolicAnalysis.bmr} kcal</div>
                <div>TDEE: {generatedPlan.metabolicAnalysis.tdee} kcal</div>
                <div>Target: {generatedPlan.metabolicAnalysis.targetCaloriesWeek1} kcal</div>
                <div>Body Fat: {generatedPlan.metabolicAnalysis.bodyComposition.bodyFatPercentage}%</div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
              <h3 className="font-semibold text-green-900 mb-2">Macro Targets</h3>
              <div className="space-y-1 text-sm">
                <div>Protein: {generatedPlan.macroStrategy.baseDistribution.protein}g</div>
                <div>Carbs: {generatedPlan.macroStrategy.baseDistribution.carbohydrates}g</div>
                <div>Fats: {generatedPlan.macroStrategy.baseDistribution.fats}g</div>
                <div>Fiber: {generatedPlan.macroStrategy.baseDistribution.fiber}g</div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
              <h3 className="font-semibold text-purple-900 mb-2">Predictions</h3>
              <div className="space-y-1 text-sm">
                <div>Weight Change: {generatedPlan.predictedOutcomes.weightChange > 0 ? '+' : ''}{generatedPlan.predictedOutcomes.weightChange}kg</div>
                <div>Confidence: {generatedPlan.predictedOutcomes.confidenceLevel}</div>
                <div>Duration: {generatedPlan.input.planDurationWeeks} weeks</div>
                {generatedPlan.predictedOutcomes.estimatedBodyFatChange && (
                  <div>Body Fat: {generatedPlan.predictedOutcomes.estimatedBodyFatChange > 0 ? '+' : ''}{generatedPlan.predictedOutcomes.estimatedBodyFatChange.toFixed(1)}%</div>
                )}
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          {generatedPlan.validation.recommendations.length > 0 && (
            <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-3">💡 Personalized Recommendations</h3>
              <ul className="space-y-2">
                {generatedPlan.validation.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start text-sm text-yellow-800">
                    <div className="w-1 h-1 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Warnings */}
          {generatedPlan.validation.warnings.length > 0 && (
            <Card className="p-4 mb-6 bg-red-50 border-red-200">
              <h3 className="font-semibold text-red-900 mb-3">⚠️ Important Notes</h3>
              <ul className="space-y-2">
                {generatedPlan.validation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start text-sm text-red-800">
                    <div className="w-1 h-1 bg-red-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    {warning}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => {
                setGeneratedPlan(null);
                setCurrentStep(1);
              }}
              variant="outline"
            >
              Generate New Plan
            </Button>
            <Button
              onClick={() => {
                const planJson = JSON.stringify(generatedPlan, null, 2);
                const blob = new Blob([planJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transformation-plan-${generatedPlan.id}.json`;
                a.click();
              }}
            >
              Download Plan
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`max-w-4xl mx-auto ${className}`}>
      <div className="p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🤖 AI Performance Nutrition Engine
          </h2>
          <p className="text-gray-600">
            Advanced metabolic analysis with intelligent progression programming
          </p>
        </div>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderPersonalMetrics()}
          {currentStep === 2 && renderGoalSelection()}
          
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
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? 'Generating Plan...' : '🚀 Generate AI Plan'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Card>
  );
}