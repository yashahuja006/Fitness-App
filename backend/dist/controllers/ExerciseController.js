"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseController = void 0;
const firebase_1 = require("../config/firebase");
const errorHandler_1 = require("../middleware/errorHandler");
class ExerciseController {
    constructor() {
        this.searchExercises = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { query, category, difficulty, equipment, muscleGroup, page = 1, limit = 20 } = req.query;
            try {
                let exercisesQuery = firebase_1.db.collection('exercises');
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
                let exercises = exercisesSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data()
                }));
                if (query) {
                    const searchTerm = String(query).toLowerCase();
                    exercises = exercises.filter(exercise => exercise.name.toLowerCase().includes(searchTerm) ||
                        exercise.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
                }
                const response = {
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
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to search exercises', 500);
            }
        });
        this.getExercise = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const { exerciseId } = req.params;
            try {
                const exerciseDoc = await firebase_1.db.collection('exercises').doc(String(exerciseId)).get();
                if (!exerciseDoc.exists) {
                    throw (0, errorHandler_1.createError)('Exercise not found', 404);
                }
                const exercise = { id: exerciseDoc.id, ...exerciseDoc.data() };
                const response = {
                    success: true,
                    data: { exercise },
                    meta: { timestamp: new Date().toISOString() }
                };
                res.status(200).json(response);
            }
            catch (error) {
                throw (0, errorHandler_1.createError)('Failed to get exercise', 500);
            }
        });
        this.getCategories = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            const categories = [
                'strength',
                'cardio',
                'flexibility',
                'balance',
                'sports',
                'rehabilitation'
            ];
            const response = {
                success: true,
                data: { categories },
                meta: { timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        });
        this.getMuscleGroups = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
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
            const response = {
                success: true,
                data: { muscleGroups },
                meta: { timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        });
        this.getEquipmentTypes = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
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
            const response = {
                success: true,
                data: { equipment },
                meta: { timestamp: new Date().toISOString() }
            };
            res.status(200).json(response);
        });
        this.getRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { recommendations: [] } });
        });
        this.addToFavorites = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Added to favorites' });
        });
        this.removeFromFavorites = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Removed from favorites' });
        });
        this.getUserFavorites = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { favorites: [] } });
        });
        this.rateExercise = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Exercise rated' });
        });
        this.getExerciseRatings = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { ratings: [] } });
        });
        this.createExercise = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(201).json({ success: true, message: 'Exercise created' });
        });
        this.updateExercise = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Exercise updated' });
        });
        this.deleteExercise = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Exercise deleted' });
        });
        this.verifyExercise = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Exercise verified' });
        });
    }
}
exports.ExerciseController = ExerciseController;
//# sourceMappingURL=ExerciseController.js.map