import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../config/firebase';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserProfile, ApiResponse } from '../types';

export class UserController {
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

    // Remove sensitive fields
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

  updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { preferences } = req.body;

    if (!preferences) {
      throw createError('Preferences data is required', 400);
    }

    try {
      await db.collection('users').doc(userId).update({
        preferences,
        updatedAt: new Date()
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Preferences updated successfully'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to update preferences', 500);
    }
  });

  updatePersonalMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user!.uid;
    const { personalMetrics } = req.body;

    if (!personalMetrics) {
      throw createError('Personal metrics data is required', 400);
    }

    try {
      await db.collection('users').doc(userId).update({
        personalMetrics,
        updatedAt: new Date()
      });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Personal metrics updated successfully'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to update personal metrics', 500);
    }
  });

  searchUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { query, limit = 10 } = req.query;

    if (!query) {
      throw createError('Search query is required', 400);
    }

    try {
      // Basic search implementation - in production, use a proper search service
      const usersSnapshot = await db.collection('users')
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(Number(limit))
        .get();

      const users = usersSnapshot.docs.map(doc => {
        const userData = doc.data() as UserProfile;
        // Return only public information
        return {
          uid: userData.uid,
          displayName: userData.displayName,
          photoURL: userData.photoURL
        };
      });

      const response: ApiResponse<{ users: any[] }> = {
        success: true,
        data: {
          users
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to search users', 500);
    }
  });

  getPublicProfile = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    try {
      const userDoc = await db.collection('users').doc(String(userId)).get();
      
      if (!userDoc.exists) {
        throw createError('User not found', 404);
      }

      const userData = userDoc.data() as UserProfile;

      // Check privacy settings
      if (userData.preferences.privacy.profileVisibility === 'private') {
        throw createError('Profile is private', 403);
      }

      // Return only public information
      const publicProfile = {
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        // Add other public fields as needed
      };

      const response: ApiResponse<{ user: any }> = {
        success: true,
        data: {
          user: publicProfile
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to get public profile', 500);
    }
  });

  // Admin-only methods
  getAllUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    try {
      const usersSnapshot = await db.collection('users')
        .offset(offset)
        .limit(Number(limit))
        .get();

      const users = usersSnapshot.docs.map(doc => doc.data() as UserProfile);

      const response: ApiResponse<{ users: UserProfile[] }> = {
        success: true,
        data: {
          users
        },
        meta: {
          timestamp: new Date().toISOString(),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: users.length,
            totalPages: Math.ceil(users.length / Number(limit))
          }
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to get users', 500);
    }
  });

  deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    try {
      await db.collection('users').doc(String(userId)).delete();

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'User deleted successfully'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to delete user', 500);
    }
  });

  updateUserRole = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'instructor', 'admin'].includes(role)) {
      throw createError('Valid role is required', 400);
    }

    try {
      // Update custom claims in Firebase Auth
      await auth.setCustomUserClaims(String(userId), { role });

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'User role updated successfully'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);
    } catch (error) {
      throw createError('Failed to update user role', 500);
    }
  });
}