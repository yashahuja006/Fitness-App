/**
 * Unit tests for Meal Structure Generator
 */

import {
  generateMealStructure,
  determineMealStructureType,
  generateMealTimings,
  calculateMealCalorieDistribution,
  calculateMealMacroDistribution,
  generateSnackStructure,
  validateMealStructure,
  applyMealStructureToMacros,
  MealStructurePreferences,
  MealTiming
} from '../lib/mealStructureGenerator';
import { MacroDistribution } from '../lib/macroIntelligenceSystem';

describe('Meal Structure Generator', () => {
  
  describe('determineMealStructureType', () => {
    it('should return intermittent_fasting when IF is enabled', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 0,
        goal: 'fat_loss',
        intermittentFasting: true,
        fastingHours: 16
      };
      
      expect(determineMealStructureType(preferences)).toBe('intermittent_fasting');
    });
    
    it('should return frequent_small for 5+ meals per day', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 5,
        snacksPerDay: 1,
        goal: 'muscle_gain'
      };
      
      expect(determineMealStructureType(preferences)).toBe('frequent_small');
    });
    
    it('should return athlete for high training frequency', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 4,
        snacksPerDay: 1,
        goal: 'muscle_gain',
        workoutDaysPerWeek: 6
      };
      
      expect(determineMealStructureType(preferences)).toBe('athlete');
    });
    
    it('should return traditional for 3 meals and 0-1 snacks', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 1,
        goal: 'recomposition'
      };
      
      expect(determineMealStructureType(preferences)).toBe('traditional');
    });
    
    it('should return custom for other combinations', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 4,
        snacksPerDay: 2,
        goal: 'fat_loss'
      };
      
      expect(determineMealStructureType(preferences)).toBe('custom');
    });
  });
  
  describe('generateMealTimings', () => {
    it('should generate 3 meal timings for traditional structure', () => {
      const timings = generateMealTimings('traditional', 3);
      
      expect(timings).toHaveLength(3);
      expect(timings[0].name).toBe('Breakfast');
      expect(timings[1].name).toBe('Lunch');
      expect(timings[2].name).toBe('Dinner');
    });
    
    it('should generate IF timings with eating window', () => {
      const timings = generateMealTimings('intermittent_fasting', 3, undefined, 16);
      
      expect(timings).toHaveLength(3);
      expect(timings[0].suggestedTime).toContain('PM'); // Should start at noon
    });
    
    it('should generate 5 meal timings for frequent_small structure', () => {
      const timings = generateMealTimings('frequent_small', 5);
      
      expect(timings).toHaveLength(5);
      timings.forEach((timing, index) => {
        expect(timing.name).toBe(`Meal ${index + 1}`);
      });
    });
    
    it('should mark pre/post workout meals for athlete structure', () => {
      const timings = generateMealTimings('athlete', 4);
      
      const preWorkout = timings.find(t => t.isPreWorkout);
      const postWorkout = timings.find(t => t.isPostWorkout);
      
      expect(preWorkout).toBeDefined();
      expect(postWorkout).toBeDefined();
    });
    
    it('should adjust timings based on workout time', () => {
      const timings = generateMealTimings('traditional', 3, 'morning');
      
      expect(timings[0].isPreWorkout).toBe(true);
      expect(timings[1].isPostWorkout).toBe(true);
    });
  });
  
  describe('calculateMealCalorieDistribution', () => {
    it('should distribute calories evenly for frequent_small structure', () => {
      const distribution = calculateMealCalorieDistribution(5, 'muscle_gain', 'frequent_small');
      
      expect(distribution).toHaveLength(5);
      distribution.forEach(percentage => {
        expect(percentage).toBeCloseTo(0.20, 2);
      });
    });
    
    it('should use traditional distribution for 3 meals', () => {
      const distribution = calculateMealCalorieDistribution(3, 'recomposition', 'traditional');
      
      expect(distribution).toHaveLength(3);
      expect(distribution[0]).toBeCloseTo(0.30, 2); // Breakfast
      expect(distribution[1]).toBeCloseTo(0.35, 2); // Lunch
      expect(distribution[2]).toBeCloseTo(0.35, 2); // Dinner
    });
    
    it('should adjust for muscle gain goal', () => {
      const distribution = calculateMealCalorieDistribution(4, 'muscle_gain', 'athlete');
      
      expect(distribution).toHaveLength(4);
      // Post-workout meal should be larger
      expect(distribution[2]).toBeGreaterThan(distribution[0]);
    });
    
    it('should front-load calories for fat loss', () => {
      const distribution = calculateMealCalorieDistribution(3, 'fat_loss', 'traditional');
      
      expect(distribution).toHaveLength(3);
      // Breakfast should be increased, dinner decreased
      expect(distribution[0]).toBeGreaterThanOrEqual(0.30);
    });
    
    it('should sum to approximately 1.0', () => {
      const distribution = calculateMealCalorieDistribution(4, 'recomposition', 'custom');
      
      const sum = distribution.reduce((acc, val) => acc + val, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });
  });
  
  describe('calculateMealMacroDistribution', () => {
    it('should increase carbs for pre-workout meals', () => {
      const timing: MealTiming = {
        name: 'Pre-Workout',
        timeRange: '11:00-12:00 AM',
        suggestedTime: '11:30 AM',
        isPreWorkout: true
      };
      
      const macros = calculateMealMacroDistribution(timing, 'muscle_gain');
      
      expect(macros.carbPercentage).toBeGreaterThan(50);
      expect(macros.fatPercentage).toBeLessThan(25);
    });
    
    it('should increase protein for post-workout meals', () => {
      const timing: MealTiming = {
        name: 'Post-Workout',
        timeRange: '2:00-3:00 PM',
        suggestedTime: '2:30 PM',
        isPostWorkout: true
      };
      
      const macros = calculateMealMacroDistribution(timing, 'muscle_gain');
      
      expect(macros.proteinPercentage).toBeGreaterThan(30);
      expect(macros.carbPercentage).toBeGreaterThan(45);
    });
    
    it('should adjust for keto diet type', () => {
      const timing: MealTiming = {
        name: 'Breakfast',
        timeRange: '7:00-8:00 AM',
        suggestedTime: '7:30 AM'
      };
      
      const macros = calculateMealMacroDistribution(timing, 'fat_loss', 'keto');
      
      expect(macros.fatPercentage).toBeGreaterThan(60);
      expect(macros.carbPercentage).toBeLessThan(10);
    });
    
    it('should increase protein for fat loss goal', () => {
      const timing: MealTiming = {
        name: 'Lunch',
        timeRange: '12:00-1:00 PM',
        suggestedTime: '12:30 PM'
      };
      
      const macros = calculateMealMacroDistribution(timing, 'fat_loss');
      
      expect(macros.proteinPercentage).toBeGreaterThan(30);
    });
    
    it('should sum to 100%', () => {
      const timing: MealTiming = {
        name: 'Dinner',
        timeRange: '7:00-8:00 PM',
        suggestedTime: '7:30 PM'
      };
      
      const macros = calculateMealMacroDistribution(timing, 'recomposition');
      
      const sum = macros.proteinPercentage + macros.carbPercentage + macros.fatPercentage;
      expect(sum).toBe(100);
    });
  });
  
  describe('generateSnackStructure', () => {
    it('should return empty array for 0 snacks', () => {
      const snacks = generateSnackStructure(0, [], 'fat_loss');
      
      expect(snacks).toHaveLength(0);
    });
    
    it('should generate correct number of snacks', () => {
      const mealTimings: MealTiming[] = [
        { name: 'Breakfast', timeRange: '7:00-8:00 AM', suggestedTime: '7:30 AM' },
        { name: 'Lunch', timeRange: '12:00-1:00 PM', suggestedTime: '12:30 PM' },
        { name: 'Dinner', timeRange: '7:00-8:00 PM', suggestedTime: '7:30 PM' }
      ];
      
      const snacks = generateSnackStructure(2, mealTimings, 'muscle_gain');
      
      expect(snacks).toHaveLength(2);
    });
    
    it('should set snack type correctly', () => {
      const snacks = generateSnackStructure(1, [], 'recomposition');
      
      expect(snacks[0].type).toBe('snack');
    });
    
    it('should allocate appropriate calories per snack', () => {
      const snacks = generateSnackStructure(2, [], 'endurance');
      
      snacks.forEach(snack => {
        expect(snack.caloriePercentage).toBeGreaterThan(0);
        expect(snack.caloriePercentage).toBeLessThan(0.15); // Should be less than 15% per snack
      });
      
      // Total snack percentage should be reasonable
      const totalSnackPercentage = snacks.reduce((sum, s) => sum + s.caloriePercentage, 0);
      expect(totalSnackPercentage).toBeLessThanOrEqual(0.20); // Max 20% for all snacks
    });
    
    it('should have higher protein percentage for satiety', () => {
      const snacks = generateSnackStructure(1, [], 'fat_loss');
      
      expect(snacks[0].macroDistribution.proteinPercentage).toBeGreaterThanOrEqual(40);
    });
  });
  
  describe('generateMealStructure', () => {
    it('should generate complete meal structure for traditional 3 meals', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 1,
        goal: 'fat_loss'
      };
      
      const structure = generateMealStructure(preferences);
      
      expect(structure.meals).toHaveLength(3);
      expect(structure.snacks).toHaveLength(1);
      expect(structure.structureType).toBe('traditional');
      expect(structure.totalMeals).toBe(3);
      expect(structure.totalSnacks).toBe(1);
    });
    
    it('should generate IF structure with eating window', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 0,
        goal: 'fat_loss',
        intermittentFasting: true,
        fastingHours: 16
      };
      
      const structure = generateMealStructure(preferences);
      
      expect(structure.structureType).toBe('intermittent_fasting');
      expect(structure.eatingWindow).toBeDefined();
      expect(structure.eatingWindow?.durationHours).toBe(8);
    });
    
    it('should generate athlete structure with workout timing', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 4,
        snacksPerDay: 1,
        goal: 'muscle_gain',
        workoutTime: 'afternoon',
        workoutDaysPerWeek: 5
      };
      
      const structure = generateMealStructure(preferences);
      
      expect(structure.structureType).toBe('athlete');
      expect(structure.workoutTiming).toBeDefined();
      expect(structure.workoutTiming?.preferredTime).toBe('afternoon');
    });
    
    it('should include recommendations', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 5,
        snacksPerDay: 0,
        goal: 'muscle_gain'
      };
      
      const structure = generateMealStructure(preferences);
      
      expect(structure.recommendations).toBeDefined();
      expect(structure.recommendations.length).toBeGreaterThan(0);
    });
    
    it('should assign unique IDs to meals and snacks', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 4,
        snacksPerDay: 2,
        goal: 'recomposition'
      };
      
      const structure = generateMealStructure(preferences);
      
      const allIds = [
        ...structure.meals.map(m => m.id),
        ...structure.snacks.map(s => s.id)
      ];
      
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
    
    it('should set priorities correctly', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 2,
        goal: 'fat_loss'
      };
      
      const structure = generateMealStructure(preferences);
      
      structure.meals.forEach((meal, index) => {
        expect(meal.priority).toBe(index + 1);
      });
      
      structure.snacks.forEach((snack, index) => {
        expect(snack.priority).toBeGreaterThanOrEqual(10);
      });
    });
  });
  
  describe('validateMealStructure', () => {
    it('should validate correct meal structure', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 1,
        goal: 'recomposition' // Use recomposition to avoid goal-specific adjustments
      };
      
      const structure = generateMealStructure(preferences);
      const validation = validateMealStructure(structure);
      
      // Log validation details if it fails
      if (!validation.isValid) {
        console.log('Validation errors:', validation.errors);
        console.log('Validation warnings:', validation.warnings);
        
        const totalCaloriePercentage = [
          ...structure.meals,
          ...structure.snacks
        ].reduce((sum, item) => sum + item.caloriePercentage, 0);
        console.log('Total calorie percentage:', totalCaloriePercentage);
      }
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
    
    it('should detect invalid calorie percentage total', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 0,
        goal: 'muscle_gain'
      };
      
      const structure = generateMealStructure(preferences);
      // Manually break the calorie percentages
      structure.meals[0].caloriePercentage = 0.50;
      
      const validation = validateMealStructure(structure);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
    
    it('should detect invalid meal count', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 0,
        goal: 'recomposition'
      };
      
      const structure = generateMealStructure(preferences);
      structure.meals = []; // Remove all meals
      
      const validation = validateMealStructure(structure);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Meal count should be between 2 and 6');
    });
    
    it('should warn about too many snacks', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 3,
        goal: 'muscle_gain'
      };
      
      const structure = generateMealStructure(preferences);
      // Add extra snacks
      structure.snacks.push({
        id: 'snack-4',
        name: 'Snack 4',
        type: 'snack',
        timing: { name: 'Snack 4', timeRange: 'Flexible', suggestedTime: 'Between meals' },
        caloriePercentage: 0.05,
        macroDistribution: { proteinPercentage: 40, carbPercentage: 35, fatPercentage: 25 },
        priority: 14,
        description: 'Extra snack'
      });
      
      const validation = validateMealStructure(structure);
      
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });
  
  describe('applyMealStructureToMacros', () => {
    it('should distribute macros across meals correctly', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 0,
        goal: 'muscle_gain'
      };
      
      const structure = generateMealStructure(preferences);
      
      const dailyMacros: MacroDistribution = {
        protein: 180,
        carbohydrates: 300,
        fats: 60,
        fiber: 35,
        calories: 2400
      };
      
      const mealMacros = applyMealStructureToMacros(structure, dailyMacros);
      
      expect(mealMacros.size).toBe(3);
      
      // Check that total calories are preserved
      let totalCalories = 0;
      mealMacros.forEach(macros => {
        totalCalories += macros.calories;
      });
      
      expect(totalCalories).toBeCloseTo(dailyMacros.calories, 0);
    });
    
    it('should calculate macros for each meal based on percentages', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 1,
        goal: 'fat_loss'
      };
      
      const structure = generateMealStructure(preferences);
      
      const dailyMacros: MacroDistribution = {
        protein: 160,
        carbohydrates: 200,
        fats: 50,
        fiber: 30,
        calories: 2000
      };
      
      const mealMacros = applyMealStructureToMacros(structure, dailyMacros);
      
      expect(mealMacros.size).toBe(4); // 3 meals + 1 snack
      
      mealMacros.forEach((macros, mealId) => {
        expect(macros.protein).toBeGreaterThan(0);
        expect(macros.carbohydrates).toBeGreaterThan(0);
        expect(macros.fats).toBeGreaterThan(0);
        expect(macros.calories).toBeGreaterThan(0);
      });
    });
    
    it('should handle different meal structures', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 5,
        snacksPerDay: 2,
        goal: 'endurance'
      };
      
      const structure = generateMealStructure(preferences);
      
      const dailyMacros: MacroDistribution = {
        protein: 140,
        carbohydrates: 400,
        fats: 55,
        fiber: 40,
        calories: 2800
      };
      
      const mealMacros = applyMealStructureToMacros(structure, dailyMacros);
      
      expect(mealMacros.size).toBe(7); // 5 meals + 2 snacks
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle minimum meal count (3)', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 3,
        snacksPerDay: 0,
        goal: 'fat_loss'
      };
      
      const structure = generateMealStructure(preferences);
      
      expect(structure.meals).toHaveLength(3);
      expect(structure.snacks).toHaveLength(0);
    });
    
    it('should handle maximum meal count (6)', () => {
      const preferences: MealStructurePreferences = {
        mealsPerDay: 6,
        snacksPerDay: 0,
        goal: 'muscle_gain'
      };
      
      const structure = generateMealStructure(preferences);
      
      expect(structure.meals).toHaveLength(6);
    });
    
    it('should handle all goal types', () => {
      const goals: Array<'fat_loss' | 'muscle_gain' | 'recomposition' | 'endurance'> = [
        'fat_loss',
        'muscle_gain',
        'recomposition',
        'endurance'
      ];
      
      goals.forEach(goal => {
        const preferences: MealStructurePreferences = {
          mealsPerDay: 4,
          snacksPerDay: 1,
          goal
        };
        
        const structure = generateMealStructure(preferences);
        
        expect(structure.meals).toHaveLength(4);
        expect(structure.snacks).toHaveLength(1);
      });
    });
    
    it('should handle all workout times', () => {
      const workoutTimes: Array<'morning' | 'afternoon' | 'evening'> = [
        'morning',
        'afternoon',
        'evening'
      ];
      
      workoutTimes.forEach(workoutTime => {
        const preferences: MealStructurePreferences = {
          mealsPerDay: 4,
          snacksPerDay: 0,
          goal: 'muscle_gain',
          workoutTime
        };
        
        const structure = generateMealStructure(preferences);
        
        expect(structure.workoutTiming?.preferredTime).toBe(workoutTime);
      });
    });
  });
});
