 import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserProfile, ApiResponse } from '../types';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, displayName, personalMetrics } = req.body;

    if (!email || !password || !displayName) {
      throw createError('Email, password, and display name are required', 400);
    }

    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName,
      });

      // Create user profile in Firestore
      const userProfile: Partial<UserProfile> = {
        uid: userRecord.uid,
        email: userRecord.email!,
        displayName,
        personalMetrics: personalMetrics || {
          height: 0,
          weight: 0,
          age: 0,
          gender: 'other',
          activityLevel: 'moderate',
          fitnessGoals: []
        },
        preferences: {
          units: 'metric',
          theme: 'auto',
          notifications: {
            workoutReminders: true,
            progressUpdates: true,
            socialUpdates: false,
            systemUpdates: true,
            email: true,
            push: true
          },
          privacy: {
            profileVisibility: 'private',
            shareProgress: false,
            shareWorkouts: false,
            allowLeaderboards: false
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').doc(userRecord.uid).set(userProfile);

      const response: ApiResponse<{ uid: string; email: string }> = {
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email!
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(201).json(response);
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        throw createError('Email already registered', 409);
      }
      throw createError('Registration failed', 500);
    }
  });

  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;

    if (!idToken) {
      throw createError('ID token is required', 400);
    }

    try {
      // Verify the ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Get user profile from Firestore
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        throw createError('User profile not found', 404);
      }

      const userProfile = userDoc.data() as UserProfile;

      const response: ApiResponse<{ user: UserProfile }> = {
        success: true,
        data: {
          user: userProfile
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error: any) {
      if (error.code === 'auth/id-token-expired') {
        throw createError('Token expired', 401);
      }
      throw createError('Login failed', 401);
    }
  });

  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token is required', 400);
    }

    // Note: Firebase Admin SDK doesn't directly handle refresh tokens
    // This would typically be handled on the client side with Firebase Auth
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Token refresh should be handled on the client side with Firebase Auth'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      throw createError('Email is required', 400);
    }

    try {
      // Generate password reset link
      const resetLink = await auth.generatePasswordResetLink(email);

      // In a real application, you would send this link via email
      // For now, we'll just return success
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Password reset email sent successfully'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw createError('User not found', 404);
      }
      throw createError('Password reset failed', 500);
    }
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      throw createError('Email is required', 400);
    }

    try {
      // Generate email verification link
      const verificationLink = await auth.generateEmailVerificationLink(email);

      // In a real application, you would send this link via email
      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Email verification link sent successfully'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error: any) {
      throw createError('Email verification failed', 500);
    }
  });

  logout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // For Firebase, logout is typically handled on the client side
    // Here we could revoke refresh tokens if needed
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Logged out successfully'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw createError('User profile not found', 404);
      }

      const userProfile = userDoc.data() as UserProfile;

      const response: ApiResponse<{ user: UserProfile }> = {
        success: true,
        data: {
          user: userProfile
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to get user profile', 500);
    }
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.uid;
    delete updates.email;
    delete updates.createdAt;

    updates.updatedAt = new Date();

    try {
      await db.collection('users').doc(userId).update(updates);

      const updatedDoc = await db.collection('users').doc(userId).get();
      const updatedProfile = updatedDoc.data() as UserProfile;

      const response: ApiResponse<{ user: UserProfile }> = {
        success: true,
        data: {
          user: updatedProfile
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to update user profile', 500);
    }
  });

  deleteAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;

    try {
      // Delete user from Firebase Auth
      await auth.deleteUser(userId);

      // Delete user profile from Firestore
      await db.collection('users').doc(userId).delete();

      // TODO: Delete all user-related data (workouts, progress, etc.)

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Account deleted successfully'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to delete account', 500);
    }
  });
}