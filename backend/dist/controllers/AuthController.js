"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const firebase_1 = require("../config/firebase");
const errorHandler_1 = require("../middleware/errorHandler");
class AuthController {
    constructor() {
        this.register = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { email, password, displayName, personalMetrics } = req.body;
            if (!email || !password || !displayName) {
                throw (0, errorHandler_1.createError)('Email, password, and display name are required', 400);
            }
            try {
                const userRecord = await firebase_1.auth.createUser({
                    email,
                    password,
                    displayName,
                });
                const userProfile = {
                    uid: userRecord.uid,
                    email: userRecord.email,
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
                await firebase_1.db.collection('users').doc(userRecord.uid).set(userProfile);
                const response = {
                    success: true,
                    data: {
                        uid: userRecord.uid,
                        email: userRecord.email
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(201).json(response);
            }
            catch (error) {
                if (error.code === 'auth/email-already-exists') {
                    throw (0, errorHandler_1.createError)('Email already registered', 409);
                }
                throw (0, errorHandler_1.createError)('Registration failed', 500);
            }
        });
        this.login = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { idToken } = req.body;
            if (!idToken) {
                throw (0, errorHandler_1.createError)('ID token is required', 400);
            }
            try {
                const decodedToken = await firebase_1.auth.verifyIdToken(idToken);
                const userDoc = await firebase_1.db.collection('users').doc(decodedToken.uid).get();
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
                if (error.code === 'auth/id-token-expired') {
                    throw (0, errorHandler_1.createError)('Token expired', 401);
                }
                throw (0, errorHandler_1.createError)('Login failed', 401);
            }
        });
        this.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw (0, errorHandler_1.createError)('Refresh token is required', 400);
            }
            const response = {
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
        this.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { email } = req.body;
            if (!email) {
                throw (0, errorHandler_1.createError)('Email is required', 400);
            }
            try {
                const resetLink = await firebase_1.auth.generatePasswordResetLink(email);
                const response = {
                    success: true,
                    data: {
                        message: 'Password reset email sent successfully'
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                if (error.code === 'auth/user-not-found') {
                    throw (0, errorHandler_1.createError)('User not found', 404);
                }
                throw (0, errorHandler_1.createError)('Password reset failed', 500);
            }
        });
        this.verifyEmail = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { email } = req.body;
            if (!email) {
                throw (0, errorHandler_1.createError)('Email is required', 400);
            }
            try {
                const verificationLink = await firebase_1.auth.generateEmailVerificationLink(email);
                const response = {
                    success: true,
                    data: {
                        message: 'Email verification link sent successfully'
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Email verification failed', 500);
            }
        });
        this.logout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const response = {
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
        this.deleteAccount = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const userId = req.user.uid;
            try {
                await firebase_1.auth.deleteUser(userId);
                await firebase_1.db.collection('users').doc(userId).delete();
                const response = {
                    success: true,
                    data: {
                        message: 'Account deleted successfully'
                    },
                    meta: {
                        timestamp: new Date().toISOString()
                    }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to delete account', 500);
            }
        });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map