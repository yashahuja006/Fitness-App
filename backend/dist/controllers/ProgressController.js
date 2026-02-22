"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
class ProgressController {
    constructor() {
        this.getProgressOverview = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { overview: {} } });
        });
        this.recordMetrics = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(201).json({ success: true, message: 'Metrics recorded' });
        });
        this.getMetricsHistory = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { metrics: [] } });
        });
        this.updateMetrics = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Metrics updated' });
        });
        this.deleteMetrics = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Metrics deleted' });
        });
        this.getGoals = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { goals: [] } });
        });
        this.createGoal = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(201).json({ success: true, message: 'Goal created' });
        });
        this.updateGoal = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Goal updated' });
        });
        this.deleteGoal = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Goal deleted' });
        });
        this.completeGoal = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Goal completed' });
        });
        this.getWorkoutFrequencyAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { analytics: {} } });
        });
        this.getPerformanceTrends = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { trends: {} } });
        });
        this.getGoalProgressAnalytics = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { progress: {} } });
        });
        this.getBodyCompositionTrends = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { trends: {} } });
        });
        this.getProgressSummaryReport = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { report: {} } });
        });
        this.getDetailedProgressReport = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { report: {} } });
        });
        this.exportProgressData = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, message: 'Data exported' });
        });
        this.getAchievements = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { achievements: [] } });
        });
        this.getMilestones = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
            res.status(200).json({ success: true, data: { milestones: [] } });
        });
    }
}
exports.ProgressController = ProgressController;
//# sourceMappingURL=ProgressController.js.map