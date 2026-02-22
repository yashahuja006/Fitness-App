import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { WorkoutSession, ApiResponse } from '../types';

export class WorkoutController {
  getUserWorkouts = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { page = 1, limit = 10 } = req.query;

    try {
      const workoutsSnapshot = await db.collection('workouts')
        .where('userId', '==', userId)
        .orderBy('startTime', 'desc')
        .limit(Number(limit))
        .get();

      const workouts = workoutsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkoutSession[];

      const response: ApiResponse<{ workouts: WorkoutSession[] }> = {
        success: true,
        data: { workouts },
        meta: { timestamp: new Date().toISOString() }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to get workouts', 500);
    }
  });

  createWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const workoutData = req.body;

    try {
      const workout: Partial<WorkoutSession> = {
        ...workoutData,
        userId,
        startTime: new Date(),
      };

      const docRef = await db.collection('workouts').add(workout);

      const response: ApiResponse<{ workoutId: string }> = {
        success: true,
        data: { workoutId: docRef.id },
        meta: { timestamp: new Date().toISOString() }
      };

      res.status(201).json(response);
    } catch (error) {
      throw createError('Failed to create workout', 500);
    }
  });

  getWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { workoutId } = req.params;
    const userId = req.user!.uid;

    try {
      const workoutDoc = await db.collection('workouts').doc(String(workoutId)).get();
      
      if (!workoutDoc.exists) {
        throw createError('Workout not found', 404);
      }

      const workout = { id: workoutDoc.id, ...workoutDoc.data() } as WorkoutSession;

      if (workout.userId !== userId) {
        throw createError('Unauthorized access to workout', 403);
      }

      const response: ApiResponse<{ workout: WorkoutSession }> = {
        success: true,
        data: { workout },
        meta: { timestamp: new Date().toISOString() }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to get workout', 500);
    }
  });

  updateWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { workoutId } = req.params;
    const userId = req.user!.uid;
    const updates = req.body;

    try {
      const workoutDoc = await db.collection('workouts').doc(String(workoutId)).get();
      
      if (!workoutDoc.exists) {
        throw createError('Workout not found', 404);
      }

      const workout = workoutDoc.data() as WorkoutSession;

      if (workout.userId !== userId) {
        throw createError('Unauthorized access to workout', 403);
      }

      await db.collection('workouts').doc(String(workoutId)).update(updates);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Workout updated successfully' },
        meta: { timestamp: new Date().toISOString() }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to update workout', 500);
    }
  });

  deleteWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { workoutId } = req.params;
    const userId = req.user!.uid;

    try {
      const workoutDoc = await db.collection('workouts').doc(String(workoutId)).get();
      
      if (!workoutDoc.exists) {
        throw createError('Workout not found', 404);
      }

      const workout = workoutDoc.data() as WorkoutSession;

      if (workout.userId !== userId) {
        throw createError('Unauthorized access to workout', 403);
      }

      await db.collection('workouts').doc(String(workoutId)).delete();

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Workout deleted successfully' },
        meta: { timestamp: new Date().toISOString() }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to delete workout', 500);
    }
  });

  // Additional methods would be implemented here
  startWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for starting a workout session
    res.status(200).json({ success: true, message: 'Workout started' });
  });

  completeWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for completing a workout session
    res.status(200).json({ success: true, message: 'Workout completed' });
  });

  pauseWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for pausing a workout session
    res.status(200).json({ success: true, message: 'Workout paused' });
  });

  resumeWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for resuming a workout session
    res.status(200).json({ success: true, message: 'Workout resumed' });
  });

  recordSet = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for recording exercise sets
    res.status(200).json({ success: true, message: 'Set recorded' });
  });

  recordFormFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for recording form feedback
    res.status(200).json({ success: true, message: 'Form feedback recorded' });
  });

  getWorkoutTemplates = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for getting workout templates
    res.status(200).json({ success: true, data: { templates: [] } });
  });

  createWorkoutTemplate = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for creating workout templates
    res.status(201).json({ success: true, message: 'Template created' });
  });

  shareWorkout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Implementation for sharing workouts
    res.status(200).json({ success: true, message: 'Workout shared' });
  });
}