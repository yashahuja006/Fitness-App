import { Request, Response, NextFunction } from 'express';
export declare class ProgressController {
    getProgressOverview: (req: Request, res: Response, next: NextFunction) => void;
    recordMetrics: (req: Request, res: Response, next: NextFunction) => void;
    getMetricsHistory: (req: Request, res: Response, next: NextFunction) => void;
    updateMetrics: (req: Request, res: Response, next: NextFunction) => void;
    deleteMetrics: (req: Request, res: Response, next: NextFunction) => void;
    getGoals: (req: Request, res: Response, next: NextFunction) => void;
    createGoal: (req: Request, res: Response, next: NextFunction) => void;
    updateGoal: (req: Request, res: Response, next: NextFunction) => void;
    deleteGoal: (req: Request, res: Response, next: NextFunction) => void;
    completeGoal: (req: Request, res: Response, next: NextFunction) => void;
    getWorkoutFrequencyAnalytics: (req: Request, res: Response, next: NextFunction) => void;
    getPerformanceTrends: (req: Request, res: Response, next: NextFunction) => void;
    getGoalProgressAnalytics: (req: Request, res: Response, next: NextFunction) => void;
    getBodyCompositionTrends: (req: Request, res: Response, next: NextFunction) => void;
    getProgressSummaryReport: (req: Request, res: Response, next: NextFunction) => void;
    getDetailedProgressReport: (req: Request, res: Response, next: NextFunction) => void;
    exportProgressData: (req: Request, res: Response, next: NextFunction) => void;
    getAchievements: (req: Request, res: Response, next: NextFunction) => void;
    getMilestones: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=ProgressController.d.ts.map