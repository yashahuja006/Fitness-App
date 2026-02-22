"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutController = void 0;
const firebase_1 = require("../config/firebase");
const errorHandler_1 = require("../middleware/errorHandler");
class WorkoutController {
    constructor() {
        this.getUserWorkouts = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const userId = req.user.uid;
            const { page = 1, limit = 10 } = req.query;
            try {
                const workoutsSnapshot = await firebase_1.db.collection('workouts')
                    .where('userId', '==', userId)
                    .orderBy('startTime', 'desc')
                    .limit(Number(limit))
                    .get();
                const workouts = workoutsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                const response = {
                    success: true,
                    data: { workouts },
                    meta: { timestamp: new Date().toISOString() }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to get workouts', 500);
            }
        });
        this.createWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const userId = req.user.uid;
            const workoutData = req.body;
            try {
                const workout = {
                    ...workoutData,
                    userId,
                    startTime: new Date(),
                };
                const docRef = await firebase_1.db.collection('workouts').add(workout);
                const response = {
                    success: true,
                    data: { workoutId: docRef.id },
                    meta: { timestamp: new Date().toISOString() }
                };
                res.status(201).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to create workout', 500);
            }
        });
        this.getWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { workoutId } = req.params;
            const userId = req.user.uid;
            try {
                const workoutDoc = await firebase_1.db.collection('workouts').doc(String(workoutId)).get();
                if (!workoutDoc.exists) {
                    throw (0, errorHandler_1.createError)('Workout not found', 404);
                }
                const workout = { id: workoutDoc.id, ...workoutDoc.data() };
                if (workout.userId !== userId) {
                    throw (0, errorHandler_1.createError)('Unauthorized access to workout', 403);
                }
                const response = {
                    success: true,
                    data: { workout },
                    meta: { timestamp: new Date().toISOString() }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to get workout', 500);
            }
        });
        this.updateWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { workoutId } = req.params;
            const userId = req.user.uid;
            const updates = req.body;
            try {
                const workoutDoc = await firebase_1.db.collection('workouts').doc(String(workoutId)).get();
                if (!workoutDoc.exists) {
                    throw (0, errorHandler_1.createError)('Workout not found', 404);
                }
                const workout = workoutDoc.data();
                if (workout.userId !== userId) {
                    throw (0, errorHandler_1.createError)('Unauthorized access to workout', 403);
                }
                await firebase_1.db.collection('workouts').doc(String(workoutId)).update(updates);
                const response = {
                    success: true,
                    data: { message: 'Workout updated successfully' },
                    meta: { timestamp: new Date().toISOString() }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to update workout', 500);
            }
        });
        this.deleteWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { workoutId } = req.params;
            const userId = req.user.uid;
            try {
                const workoutDoc = await firebase_1.db.collection('workouts').doc(String(workoutId)).get();
                if (!workoutDoc.exists) {
                    throw (0, errorHandler_1.createError)('Workout not found', 404);
                }
                const workout = workoutDoc.data();
                if (workout.userId !== userId) {
                    throw (0, errorHandler_1.createError)('Unauthorized access to workout', 403);
                }
                await firebase_1.db.collection('workouts').doc(String(workoutId)).delete();
                const response = {
                    success: true,
                    data: { message: 'Workout deleted successfully' },
                    meta: { timestamp: new Date().toISOString() }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to delete workout', 500);
            }
        });
        this.startWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Workout started' });
        });
        this.completeWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Workout completed' });
        });
        this.pauseWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Workout paused' });
        });
        this.resumeWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Workout resumed' });
        });
        this.recordSet = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Set recorded' });
        });
        this.recordFormFeedback = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Form feedback recorded' });
        });
        this.getWorkoutTemplates = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { templates: [] } });
        });
        this.createWorkoutTemplate = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(201).json({ success: true, message: 'Template created' });
        });
        this.shareWorkout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Workout shared' });
        });
    }
}
exports.WorkoutController = WorkoutController;
//# sourceMappingURL=WorkoutController.js.map