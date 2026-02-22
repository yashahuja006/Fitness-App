"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const firebase_1 = require("../config/firebase");
const errorHandler_1 = require("../middleware/errorHandler");
class UserController {
    constructor() {
        this.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const userId = req.user.uid;
            try {
                const userDoc = await firebase_1.db.collection('users').doc(userId).get();
                if (!userDoc.exists) {
                    throw (0, errorHandler_1.createError)('User profile not found', 404);
                }
                const userProfile = userDoc.data();
                const response = {
                    success: true,
                    data: {
                        user: userProfile
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to get user profile', 500);
            }
        });
        this.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const userId = req.user.uid;
            const updates = req.body;
            delete updates.uid;
            delete updates.email;
            delete updates.createdAt;
            updates.updatedAt = new Date();
            try {
                await firebase_1.db.collection('users').doc(userId).update(updates);
                const updatedDoc = await firebase_1.db.collection('users').doc(userId).get();
                const updatedProfile = updatedDoc.data();
                const response = {
                    success: true,
                    data: {
                        user: updatedProfile
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to update user profile', 500);
            }
        });
        this.updatePreferences = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const userId = req.user.uid;
            const { preferences } = req.body;
            if (!preferences) {
                throw (0, errorHandler_1.createError)('Preferences data is required', 400);
            }
            try {
                await firebase_1.db.collection('users').doc(userId).update({
                    preferences,
                    updatedAt: new Date()
                });
                const response = {
                    success: true,
                    data: {
                        message: 'Preferences updated successfully'
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to update preferences', 500);
            }
        });
        this.updatePersonalMetrics = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const userId = req.user.uid;
            const { personalMetrics } = req.body;
            if (!personalMetrics) {
                throw (0, errorHandler_1.createError)('Personal metrics data is required', 400);
            }
            try {
                await firebase_1.db.collection('users').doc(userId).update({
                    personalMetrics,
                    updatedAt: new Date()
                });
                const response = {
                    success: true,
                    data: {
                        message: 'Personal metrics updated successfully'
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to update personal metrics', 500);
            }
        });
        this.searchUsers = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { query, limit = 10 } = req.query;
            if (!query) {
                throw (0, errorHandler_1.createError)('Search query is required', 400);
            }
            try {
                const usersSnapshot = await firebase_1.db.collection('users')
                    .where('displayName', '>=', query)
                    .where('displayName', '<=', query + '\uf8ff')
                    .limit(Number(limit))
                    .get();
                const users = usersSnapshot.docs.map(doc => {
                    const userData = doc.data();
                    return {
                        uid: userData.uid,
                        displayName: userData.displayName,
                        photoURL: userData.photoURL
                    };
                });
                const response = {
                    success: true,
                    data: {
                        users
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to search users', 500);
            }
        });
        this.getPublicProfile = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { userId } = req.params;
            try {
                const userDoc = await firebase_1.db.collection('users').doc(String(userId)).get();
                if (!userDoc.exists) {
                    throw (0, errorHandler_1.createError)('User not found', 404);
                }
                const userData = userDoc.data();
                if (userData.preferences.privacy.profileVisibility === 'private') {
                    throw (0, errorHandler_1.createError)('Profile is private', 403);
                }
                const publicProfile = {
                    uid: userData.uid,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                };
                const response = {
                    success: true,
                    data: {
                        user: publicProfile
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to get public profile', 500);
            }
        });
        this.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { page = 1, limit = 20 } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            try {
                const usersSnapshot = await firebase_1.db.collection('users')
                    .offset(offset)
                    .limit(Number(limit))
                    .get();
                const users = usersSnapshot.docs.map(doc => doc.data());
                const response = {
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
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to get users', 500);
            }
        });
        this.deleteUser = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { userId } = req.params;
            try {
                await firebase_1.db.collection('users').doc(String(userId)).delete();
                const response = {
                    success: true,
                    data: {
                        message: 'User deleted successfully'
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to delete user', 500);
            }
        });
        this.updateUserRole = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { userId } = req.params;
            const { role } = req.body;
            if (!role || !['user', 'instructor', 'admin'].includes(role)) {
                throw (0, errorHandler_1.createError)('Valid role is required', 400);
            }
            try {
                await firebase_1.auth.setCustomUserClaims(String(userId), { role });
                const response = {
                    success: true,
                    data: {
                        message: 'User role updated successfully'
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to update user role', 500);
            }
        });
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map