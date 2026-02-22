/**
 * AI Performance Nutrition & Training Engine
 * 
 * Main integration service that combines advanced metabolic analysis,
 * macro intelligence, and progressive programming into a comprehensive
 * transformation system.
 */

import { 
  AdvancedPersonalMetrics, 
  performAdvancedMetabolicAnalysis,
  AdvancedMetabolicAnalysis,
  validateAdvancedMetrics
} from './advancedMetabolicAnalysis';

import {
  generateMacroStrategy,
  MacroStrategy,
  validateMacroDistribution
} from './macroIntelligenceSystem';

import {
  generateWeeklyProgressionPlan,
  WeeklyAdjustment,
  predictWeightChange,
  validateProgressionPlan
} from './progressiveProgrammingEngine';

export interface TransformationPlanInput {
  personalMetrics: AdvancedPersonalMetrics;
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance';
  dietType?: 'standard' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean' | 'low_carb';
  planDurationWeeks?: number;
  subscriptionTier?: 'free' | 'pro';
}

export interface TransformationPlan {
  id: string;
  userId?: string;
  createdAt: Date;
  
  // Input parameters
  input: TransformationPlanInput;
  
  // Core analysis
  metabolicAnalysis: AdvancedMetabolicAnalysis;
  macroStrategy: MacroStrategy;
  weeklyProgression: WeeklyAdjustment[];
  
  // Predictions
  predictedOutcomes: {
    weightChange: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    estimatedBodyFatChange?: number;
    timeToGoal?: number; // weeks
  };
  
  // Validation results
  validation: {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  };
  
  // Subscription tier features
  tierFeatures: {
    available: string[];
    locked: string[];
    upgradePrompts: string[];
  };
}

/**
 * Generate complete transformation plan
 */
export function generateTransformationPlan(
  input: TransformationPlanInput
): TransformationPlan {
  
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  // Set defaults
  const planInput: Required<TransformationPlanInput> = {
    personalMetrics: input.personalMetrics,
    goal: input.goal,
    dietType: input.dietType || 'standard',
    planDurationWeeks: input.planDurationWeeks || 8,
    subscriptionTier: input.subscriptionTier || 'free'
  };
  
  // Validate input metrics
  const metricsValidation = validateAdvancedMetrics(planInput.personalMetrics);
  if (!metricsValidation.isValid) {
    throw new Error(`Invalid metrics: ${metricsValidation.errors.join(', ')}`);
  }
  
  // Perform advanced metabolic analysis
  const metabolicAnalysis = performAdvancedMetabolicAnalysis(
    planInput.personalMetrics,
    planInput.goal,
    planInput.planDurationWeeks
  );
  
  // Generate macro strategy
  const macroStrategy = generateMacroStrategy(
    metabolicAnalysis.targetCaloriesWeek1,
    planInput.personalMetrics,
    metabolicAnalysis.bodyComposition,
    planInput.goal,
    planInput.dietType
  );
  
  // Generate weekly progression plan
  const weeklyProgression = generateWeeklyProgressionPlan(
    metabolicAnalysis.targetCaloriesWeek1,
    planInput.goal,
    planInput.planDurationWeeks,
    metabolicAnalysis.bodyComposition.bodyFatPercentage
  );
  
  // Predict outcomes
  const avgCalorieAdjustment = weeklyProgression.reduce((sum, week) => 
    sum + (week.newCalories - metabolicAnalysis.maintenanceCalories), 0
  ) / weeklyProgression.length;
  
  const weightPrediction = predictWeightChange(
    avgCalorieAdjustment,
    planInput.planDurationWeeks,
    planInput.goal
  );
  
  // Estimate body fat change (rough calculation)
  let estimatedBodyFatChange: number | undefined;
  if (planInput.goal === 'fat_loss') {
    // Assume 70% of weight loss is fat
    estimatedBodyFatChange = -(Math.abs(weightPrediction.weightChange) * 0.7 / planInput.personalMetrics.weight) * 100;
  } else if (planInput.goal === 'muscle_gain') {
    // Assume some fat gain with muscle
    estimatedBodyFatChange = (Math.abs(weightPrediction.weightChange) * 0.3 / planInput.personalMetrics.weight) * 100;
  }
  
  // Validate macro distribution
  const macroValidation = validateMacroDistribution(macroStrategy.baseDistribution);
  
  // Validate progression plan
  const progressionValidation = validateProgressionPlan(
    weeklyProgression,
    metabolicAnalysis.targetCaloriesWeek1,
    planInput.goal
  );
  
  // Combine all validation results
  const allWarnings = [
    ...macroValidation.warnings,
    ...progressionValidation.warnings
  ];
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    planInput,
    metabolicAnalysis,
    macroStrategy
  );
  
  // Determine tier features
  const tierFeatures = determineTierFeatures(planInput.subscriptionTier);
  
  const transformationPlan: TransformationPlan = {
    id: planId,
    createdAt: new Date(),
    input: planInput,
    metabolicAnalysis,
    macroStrategy,
    weeklyProgression,
    predictedOutcomes: {
      weightChange: weightPrediction.weightChange,
      confidenceLevel: weightPrediction.confidenceLevel,
      estimatedBodyFatChange,
      timeToGoal: planInput.planDurationWeeks
    },
    validation: {
      isValid: macroValidation.isValid && progressionValidation.isValid,
      warnings: allWarnings,
      recommendations
    },
    tierFeatures
  };
  
  return transformationPlan;
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
  input: Required<TransformationPlanInput>,
  metabolicAnalysis: AdvancedMetabolicAnalysis,
  macroStrategy: MacroStrategy
): string[] {
  
  const recommendations: string[] = [];
  
  // Body composition recommendations
  if (metabolicAnalysis.bodyComposition.bodyFatPercentage > 25) {
    recommendations.push('Focus on creating a sustainable calorie deficit with regular cardio');
  } else if (metabolicAnalysis.bodyComposition.bodyFatPercentage < 12) {
    recommendations.push('Consider refeed days and diet breaks to support hormonal health');
  }
  
  // Protein recommendations
  if (macroStrategy.proteinTarget.method === 'lean_body_mass') {
    recommendations.push('Protein targets based on lean body mass for optimal muscle preservation');
  } else {
    recommendations.push('Consider body fat testing for more precise protein targets');
  }
  
  // Goal-specific recommendations
  switch (input.goal) {
    case 'fat_loss':
      recommendations.push('Prioritize strength training to preserve muscle during fat loss');
      recommendations.push('Stay hydrated and consider electrolyte supplementation');
      break;
      
    case 'muscle_gain':
      recommendations.push('Focus on progressive overload in your training program');
      recommendations.push('Ensure adequate sleep (7-9 hours) for optimal recovery');
      break;
      
    case 'recomposition':
      recommendations.push('Be patient - body recomposition takes time but yields lasting results');
      recommendations.push('Track progress through measurements and photos, not just weight');
      break;
      
    case 'endurance':
      recommendations.push('Time carbohydrate intake around training sessions');
      recommendations.push('Consider periodizing nutrition with training cycles');
      break;
  }
  
  // Subscription tier recommendations
  if (input.subscriptionTier === 'free') {
    recommendations.push('Upgrade to Pro for advanced features like carb cycling and meal prep optimization');
  }
  
  // Diet type recommendations
  if (input.dietType === 'vegan' || input.dietType === 'vegetarian') {
    recommendations.push('Focus on complete protein sources and B12 supplementation');
  } else if (input.dietType === 'keto') {
    recommendations.push('Monitor electrolyte balance and consider MCT oil for energy');
  }
  
  return recommendations;
}

/**
 * Determine available and locked features based on subscription tier
 * Integrates with subscription validation system
 */
function determineTierFeatures(tier: 'free' | 'pro'): {
  available: string[];
  locked: string[];
  upgradePrompts: string[];
} {
  
  const freeFeatures = [
    'Basic metabolic analysis',
    'Standard macro distribution',
    'Weekly calorie targets',
    'Progress tracking',
    'Basic meal planning'
  ];
  
  const proFeatures = [
    'Advanced body composition analysis',
    'Carb cycling strategies',
    'Refeed day scheduling',
    'Plateau prevention algorithms',
    'Meal prep optimization',
    'Grocery list consolidation',
    'Advanced progress predictions',
    'Custom macro cycling'
  ];
  
  // Pro tier gets all features (subscription validation happens at middleware level)
  if (tier === 'pro') {
    return {
      available: [...freeFeatures, ...proFeatures],
      locked: [],
      upgradePrompts: []
    };
  } else {
    return {
      available: freeFeatures,
      locked: proFeatures,
      upgradePrompts: [
        'Unlock carb cycling for better results',
        'Get advanced meal prep strategies',
        'Access plateau prevention algorithms',
        'Optimize your grocery shopping'
      ]
    };
  }
}

/**
 * Update transformation plan with progress data
 */
export function updateTransformationPlan(
  plan: TransformationPlan,
  progressData: {
    week: number;
    weight?: number;
    bodyFatPercentage?: number;
    adherenceScore: number;
  }
): TransformationPlan {
  
  // This would integrate with the progressive programming engine
  // to make real-time adjustments based on actual progress
  
  // For now, return the plan unchanged
  // In full implementation, this would:
  // 1. Update weekly progression based on actual progress
  // 2. Detect plateaus and adjust calories
  // 3. Schedule refeeds if needed
  // 4. Update predictions based on actual results
  
  return plan;
}

/**
 * Export plan to JSON format for API responses
 */
export function exportPlanToJSON(plan: TransformationPlan): string {
  return JSON.stringify(plan, null, 2);
}

/**
 * Validate transformation plan for API responses
 */
export function validateTransformationPlan(plan: TransformationPlan): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!plan.id) {
    errors.push('Plan ID is required');
  }
  
  if (!plan.metabolicAnalysis) {
    errors.push('Metabolic analysis is required');
  }
  
  if (!plan.macroStrategy) {
    errors.push('Macro strategy is required');
  }
  
  if (!plan.weeklyProgression || plan.weeklyProgression.length === 0) {
    errors.push('Weekly progression is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}