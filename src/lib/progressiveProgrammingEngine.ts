/**
 * Progressive Programming Engine
 * 
 * Intelligent weekly progression system with plateau detection, automatic adjustments,
 * and refeed scheduling for the AI Performance Nutrition Engine.
 */

export interface ProgressData {
  week: number;
  weight?: number;
  bodyFatPercentage?: number;
  adherenceScore: number; // 0-100
  energyLevel: number; // 1-10
  hungerLevel: number; // 1-10
  workoutPerformance: number; // 1-10
}

export interface PlateauDetection {
  isPlateaued: boolean;
  weeksStalled: number;
  recommendedAction: 'continue' | 'refeed' | 'diet_break' | 'calorie_adjustment';
  adjustmentAmount: number; // kcal
}

export interface WeeklyAdjustment {
  week: number;
  previousCalories: number;
  newCalories: number;
  adjustmentReason: string;
  adjustmentType: 'plateau_prevention' | 'progress_stall' | 'adherence_issue' | 'scheduled_taper';
  refeedScheduled: boolean;
}

/**
 * Detect plateau based on progress data
 */
export function detectPlateau(
  progressHistory: ProgressData[],
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'
): PlateauDetection {
  
  if (progressHistory.length < 3) {
    return {
      isPlateaued: false,
      weeksStalled: 0,
      recommendedAction: 'continue',
      adjustmentAmount: 0
    };
  }
  
  const recentWeeks = progressHistory.slice(-3);
  let stallWeeks = 0;
  
  switch (goal) {
    case 'fat_loss':
      // Check for weight loss stall (less than 0.25kg loss per week average)
      const weightChanges = recentWeeks.map((week, index) => {
        if (index === 0) return 0;
        const prevWeight = recentWeeks[index - 1].weight || 0;
        const currentWeight = week.weight || 0;
        return prevWeight - currentWeight; // Positive = weight loss
      }).filter(change => change !== 0);
      
      const avgWeightLoss = weightChanges.reduce((sum, change) => sum + change, 0) / weightChanges.length;
      
      if (avgWeightLoss < 0.25) {
        stallWeeks = weightChanges.length;
      }
      break;
      
    case 'muscle_gain':
      // Check for weight gain stall (less than 0.25kg gain per week)
      const gainChanges = recentWeeks.map((week, index) => {
        if (index === 0) return 0;
        const prevWeight = recentWeeks[index - 1].weight || 0;
        const currentWeight = week.weight || 0;
        return currentWeight - prevWeight; // Positive = weight gain
      }).filter(change => change !== 0);
      
      const avgWeightGain = gainChanges.reduce((sum, change) => sum + change, 0) / gainChanges.length;
      
      if (avgWeightGain < 0.25) {
        stallWeeks = gainChanges.length;
      }
      break;
      
    case 'recomposition':
      // Check for performance and body composition stalls
      const avgPerformance = recentWeeks.reduce((sum, week) => sum + week.workoutPerformance, 0) / recentWeeks.length;
      const avgEnergy = recentWeeks.reduce((sum, week) => sum + week.energyLevel, 0) / recentWeeks.length;
      
      if (avgPerformance < 6 || avgEnergy < 6) {
        stallWeeks = 2;
      }
      break;
      
    case 'endurance':
      // Check for performance decline
      const performanceDecline = recentWeeks.some(week => week.workoutPerformance < 7);
      if (performanceDecline) {
        stallWeeks = 1;
      }
      break;
  }
  
  // Determine recommended action
  let recommendedAction: PlateauDetection['recommendedAction'] = 'continue';
  let adjustmentAmount = 0;
  
  if (stallWeeks >= 2) {
    const avgAdherence = recentWeeks.reduce((sum, week) => sum + week.adherenceScore, 0) / recentWeeks.length;
    
    if (avgAdherence < 80) {
      recommendedAction = 'continue'; // Poor adherence, don't adjust yet
    } else if (stallWeeks >= 3) {
      if (goal === 'fat_loss') {
        recommendedAction = 'refeed';
        adjustmentAmount = 0; // Refeed, not calorie adjustment
      } else {
        recommendedAction = 'calorie_adjustment';
        adjustmentAmount = goal === 'muscle_gain' ? 150 : -100;
      }
    } else {
      recommendedAction = 'calorie_adjustment';
      adjustmentAmount = goal === 'fat_loss' ? -100 : 100;
    }
  }
  
  return {
    isPlateaued: stallWeeks >= 2,
    weeksStalled: stallWeeks,
    recommendedAction,
    adjustmentAmount
  };
}

/**
 * Calculate automatic calorie adjustments
 */
export function calculateAutomaticAdjustment(
  currentCalories: number,
  progressData: ProgressData[],
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance',
  week: number
): WeeklyAdjustment {
  
  const plateauDetection = detectPlateau(progressData, goal);
  
  // Default: no adjustment
  let adjustment: WeeklyAdjustment = {
    week,
    previousCalories: currentCalories,
    newCalories: currentCalories,
    adjustmentReason: 'No adjustment needed - progress on track',
    adjustmentType: 'plateau_prevention',
    refeedScheduled: false
  };
  
  // Check for scheduled adjustments based on goal
  if (goal === 'fat_loss' && week > 3) {
    // Progressive tapering for fat loss after week 3
    const taperAmount = Math.min(50, (week - 3) * 25);
    adjustment.newCalories = currentCalories + taperAmount;
    adjustment.adjustmentReason = `Week ${week} progressive taper (+${taperAmount} kcal)`;
    adjustment.adjustmentType = 'scheduled_taper';
  }
  
  // Apply plateau-based adjustments
  if (plateauDetection.isPlateaued) {
    switch (plateauDetection.recommendedAction) {
      case 'refeed':
        adjustment.refeedScheduled = true;
        adjustment.adjustmentReason = `Refeed scheduled - ${plateauDetection.weeksStalled} weeks stalled`;
        adjustment.adjustmentType = 'progress_stall';
        break;
        
      case 'calorie_adjustment':
        adjustment.newCalories = currentCalories + plateauDetection.adjustmentAmount;
        adjustment.adjustmentReason = `Plateau detected - adjusting by ${plateauDetection.adjustmentAmount} kcal`;
        adjustment.adjustmentType = 'progress_stall';
        break;
        
      case 'diet_break':
        adjustment.newCalories = Math.round(currentCalories * 1.15); // Temporary increase
        adjustment.adjustmentReason = 'Diet break recommended - metabolic restoration';
        adjustment.adjustmentType = 'progress_stall';
        break;
    }
  }
  
  // Check adherence issues
  const recentAdherence = progressData.slice(-2).reduce((sum, week) => sum + week.adherenceScore, 0) / 2;
  if (recentAdherence < 70) {
    // Don't make aggressive adjustments if adherence is poor
    adjustment.newCalories = Math.max(adjustment.newCalories, currentCalories - 50);
    adjustment.adjustmentReason = 'Limited adjustment due to adherence concerns';
    adjustment.adjustmentType = 'adherence_issue';
  }
  
  return adjustment;
}

/**
 * Schedule refeed days for fat loss phases
 */
export function scheduleRefeedDays(
  week: number,
  bodyFatPercentage: number,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'
): { refeedScheduled: boolean; refeedCalories?: number; refeedReason?: string } {
  
  if (goal !== 'fat_loss') {
    return { refeedScheduled: false };
  }
  
  // Refeed frequency based on body fat percentage
  let refeedFrequency: number; // weeks between refeeds
  
  if (bodyFatPercentage < 12) { // Very lean
    refeedFrequency = 1; // Weekly refeeds
  } else if (bodyFatPercentage < 15) { // Lean
    refeedFrequency = 2; // Bi-weekly refeeds
  } else if (bodyFatPercentage < 20) { // Moderate
    refeedFrequency = 3; // Every 3 weeks
  } else { // Higher body fat
    refeedFrequency = 4; // Monthly refeeds
  }
  
  const shouldRefeed = week > 2 && (week - 2) % refeedFrequency === 0;
  
  if (shouldRefeed) {
    // Refeed calories: maintenance + 200-400 kcal (mostly carbs)
    const refeedCalories = Math.round(2000 + (bodyFatPercentage < 15 ? 400 : 200)); // Rough estimate
    
    return {
      refeedScheduled: true,
      refeedCalories,
      refeedReason: `Scheduled refeed (every ${refeedFrequency} weeks for ${bodyFatPercentage}% body fat)`
    };
  }
  
  return { refeedScheduled: false };
}

/**
 * Generate complete weekly progression plan
 */
export function generateWeeklyProgressionPlan(
  initialCalories: number,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance',
  weeks: number = 8,
  bodyFatPercentage: number = 20
): WeeklyAdjustment[] {
  
  const progressionPlan: WeeklyAdjustment[] = [];
  let currentCalories = initialCalories;
  
  // Simulate progress data for planning (in real implementation, this would use actual data)
  const simulatedProgress: ProgressData[] = [];
  
  for (let week = 1; week <= weeks; week++) {
    // Add simulated progress data
    simulatedProgress.push({
      week,
      weight: 80 - (goal === 'fat_loss' ? week * 0.5 : -week * 0.3), // Simulate weight change
      bodyFatPercentage: Math.max(8, bodyFatPercentage - (goal === 'fat_loss' ? week * 0.5 : 0)),
      adherenceScore: 85 + Math.random() * 10, // 85-95% adherence
      energyLevel: 7 + Math.random() * 2, // 7-9 energy
      hungerLevel: 5 + Math.random() * 2, // 5-7 hunger
      workoutPerformance: 7 + Math.random() * 2 // 7-9 performance
    });
    
    // Calculate adjustment for this week
    const adjustment = calculateAutomaticAdjustment(
      currentCalories,
      simulatedProgress,
      goal,
      week
    );
    
    // Check for refeed scheduling
    const refeedInfo = scheduleRefeedDays(week, bodyFatPercentage, goal);
    if (refeedInfo.refeedScheduled) {
      adjustment.refeedScheduled = true;
      adjustment.adjustmentReason += ` + ${refeedInfo.refeedReason}`;
    }
    
    progressionPlan.push(adjustment);
    currentCalories = adjustment.newCalories;
  }
  
  return progressionPlan;
}

/**
 * Predict weight change based on calorie deficit/surplus
 */
export function predictWeightChange(
  calorieAdjustment: number,
  weeks: number,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'
): { weightChange: number; confidenceLevel: 'high' | 'medium' | 'low' } {
  
  // 3500 kcal = 1 lb (0.45 kg) of fat
  // 2500 kcal = 1 lb (0.45 kg) of muscle (rough estimate)
  
  let caloriesPerKg: number;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  
  switch (goal) {
    case 'fat_loss':
      caloriesPerKg = 7700; // kcal per kg of fat
      confidenceLevel = 'high'; // Fat loss is more predictable
      break;
      
    case 'muscle_gain':
      caloriesPerKg = 5500; // kcal per kg of muscle (less efficient)
      confidenceLevel = 'medium'; // Muscle gain varies more
      break;
      
    case 'recomposition':
      caloriesPerKg = 6500; // Mixed fat loss and muscle gain
      confidenceLevel = 'low'; // Body recomposition is complex
      break;
      
    case 'endurance':
      caloriesPerKg = 7000; // Mostly maintaining weight
      confidenceLevel = 'medium';
      break;
  }
  
  const totalCalorieChange = calorieAdjustment * weeks * 7; // Weekly deficit/surplus
  const weightChange = totalCalorieChange / caloriesPerKg;
  
  // Adjust confidence based on magnitude
  if (Math.abs(weightChange) > 5) {
    confidenceLevel = 'low'; // Large changes are less predictable
  } else if (Math.abs(weightChange) < 1) {
    confidenceLevel = 'medium'; // Small changes have moderate confidence
  }
  
  return {
    weightChange: Math.round(weightChange * 10) / 10, // Round to 1 decimal
    confidenceLevel
  };
}

/**
 * Validate progression plan for safety and effectiveness
 */
export function validateProgressionPlan(
  progressionPlan: WeeklyAdjustment[],
  initialCalories: number,
  goal: 'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'
): { isValid: boolean; warnings: string[] } {
  
  const warnings: string[] = [];
  
  // Check for extreme calorie drops
  const minCalories = Math.min(...progressionPlan.map(week => week.newCalories));
  const maxCalories = Math.max(...progressionPlan.map(week => week.newCalories));
  
  if (goal === 'fat_loss' && minCalories < initialCalories * 0.7) {
    warnings.push('Calories drop below 70% of initial - may be too aggressive');
  }
  
  if (goal === 'muscle_gain' && maxCalories > initialCalories * 1.3) {
    warnings.push('Calories exceed 130% of initial - may lead to excessive fat gain');
  }
  
  // Check for too frequent adjustments
  const adjustmentWeeks = progressionPlan.filter(week => 
    week.adjustmentType !== 'plateau_prevention'
  ).length;
  
  if (adjustmentWeeks > progressionPlan.length * 0.5) {
    warnings.push('Too many adjustments - may indicate unrealistic expectations');
  }
  
  // Check for refeed frequency
  const refeedWeeks = progressionPlan.filter(week => week.refeedScheduled).length;
  if (goal === 'fat_loss' && refeedWeeks === 0 && progressionPlan.length > 4) {
    warnings.push('No refeeds scheduled for extended fat loss phase');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}