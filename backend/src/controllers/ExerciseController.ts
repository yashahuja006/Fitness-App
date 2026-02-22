import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { Exercise, ApiResponse } from '../types';

export class ExerciseController {
  searchExercises = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { 
      query, 
      category, 
      difficulty, 
      equipment, 
      muscleGroup, 
      page = 1, 
      limit = 20 
    } = req.query;

    try {
      let exercisesQuery: any = db.collection('exercises');

      // Apply filters
      if (category) {
        exercisesQuery = exercisesQuery.where('category', '==', category);
      }
      if (difficulty) {
        exercisesQuery = exercisesQuery.where('difficulty', '==', difficulty);
      }
      if (equipment) {
        exercisesQuery = exercisesQuery.where('equipment', 'array-contains', equipment);
      }
      if (muscleGroup) {
        exercisesQuery = exercisesQuery.where('targetMuscles', 'array-contains', muscleGroup);
      }

      const exercisesSnapshot = await exercisesQuery
        .limit(Number(limit))
        .get();

      let exercises = exercisesSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Exercise[];

      // Apply text search if query provided
      if (query) {
        const searchTerm = String(query).toLowerCase();
        exercises = exercises.filter(exercise => 
          exercise.name.toLowerCase().includes(searchTerm) ||
          exercise.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      const response: ApiResponse<{ exercises: Exercise[] }> = {
        success: true,
        data: { exercises },
        meta: { 
          timestamp: new Date().toISOString(),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: exercises.length,
            totalPages: Math.ceil(exercises.length / Number(limit))
          }
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to search exercises', 500);
    }
  });

  getExercise = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { exerciseId } = req.params;

    try {
      const exerciseDoc = await db.collection('exercises').doc(String(exerciseId)).get();
      
      if (!exerciseDoc.exists) {
        throw createError('Exercise not found', 404);
      }

      const exercise = { id: exerciseDoc.id, ...exerciseDoc.data() } as Exercise;

      const response: ApiResponse<{ exercise: Exercise }> = {
        success: true,
        data: { exercise },
        meta: { timestamp: new Date().toISOString() }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to get exercise', 500);
    }
  });

  getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const categories = [
      'strength',
      'cardio',
      'flexibility',
      'balance',
      'sports',
      'rehabilitation'
    ];

    const response: ApiResponse<{ categories: string[] }> = {
      success: true,
      data: { categories },
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(200).json(response);
  });

  getMuscleGroups = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const muscleGroups = [
      'chest',
      'back',
      'shoulders',
      'arms',
      'core',
      'legs',
      'glutes',
      'full_body'
    ];

    const response: ApiResponse<{ muscleGroups: string[] }> = {
      success: true,
      data: { muscleGroups },
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(200).json(response);
  });

  getEquipmentTypes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const equipment = [
      'none',
      'dumbbells',
      'barbell',
      'resistance_bands',
      'kettlebell',
      'pull_up_bar',
      'bench',
      'machine'
    ];

    const response: ApiResponse<{ equipment: string[] }> = {
      success: true,
      data: { equipment },
      meta: { timestamp: new Date().toISOString() }
    };

    res.status(200).json(response);
  });

  // Protected route methods
  getRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for exercise recommendations based on user profile
    res.status(200).json({ success: true, data: { recommendations: [] } });
  });

  addToFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for adding exercise to favorites
    res.status(200).json({ success: true, message: 'Added to favorites' });
  });

  removeFromFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for removing exercise from favorites
    res.status(200).json({ success: true, message: 'Removed from favorites' });
  });

  getUserFavorites = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for getting user's favorite exercises
    res.status(200).json({ success: true, data: { favorites: [] } });
  });

  rateExercise = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for rating exercises
    res.status(200).json({ success: true, message: 'Exercise rated' });
  });

  getExerciseRatings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Implementation for getting exercise ratings
    res.status(200).json({ success: true, data: { ratings: [] } });
  });

  // Admin/Instructor methods
  createExercise = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for creating new exercises
    res.status(201).json({ success: true, message: 'Exercise created' });
  });

  updateExercise = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for updating exercises
    res.status(200).json({ success: true, message: 'Exercise updated' });
  });

  deleteExercise = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for deleting exercises
    res.status(200).json({ success: true, message: 'Exercise deleted' });
  });

  verifyExercise = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for verifying exercises
    res.status(200).json({ success: true, message: 'Exercise verified' });
  });
}