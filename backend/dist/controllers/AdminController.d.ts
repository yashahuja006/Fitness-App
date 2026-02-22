import { Request, Response, NextFunction } from 'express';
export declare class AdminController {
    getAllUsers: (req: Request, res: Response, next: NextFunction) => void;
    getUserDetails: (req: Request, res: Response, next: NextFunction) => void;
    updateUserStatus: (req: Request, res: Response, next: NextFunction) => void;
    deleteUser: (req: Request, res: Response, next: NextFunction) => void;
    resetUserPassword: (req: Request, res: Response, next: NextFunction) => void;
    getPendingExercises: (req: Request, res: Response, next: NextFunction) => void;
    approveExercise: (req: Request, res: Response, next: NextFunction) => void;
    rejectExercise: (req: Request, res: Response, next: NextFunction) => void;
    getContentReports: (req: Request, res: Response, next: NextFunction) => void;
    moderateContent: (req: Request, res: Response, next: NextFunction) => void;
    getSystemOverview: (req: Request, res: Response, next: NextFunction) => void;
    getUserAnalytics: (req: Request, res: Response, next: NextFunction) => void;
    getWorkoutAnalytics: (req: Request, res: Response, next: NextFunction) => void;
    getSystemPerformance: (req: Request, res: Response, next: NextFunction) => void;
    getDatabaseHealth: (req: Request, res: Response, next: NextFunction) => void;
    getServicesHealth: (req: Request, res: Response, next: NextFunction) => void;
    getErrorLogs: (req: Request, res: Response, next: NextFunction) => void;
    getActivityLogs: (req: Request, res: Response, next: NextFunction) => void;
    getSystemConfig: (req: Request, res: Response, next: NextFunction) => void;
    updateSystemConfig: (req: Request, res: Response, next: NextFunction) => void;
    startMaintenance: (req: Request, res: Response, next: NextFunction) => void;
    endMaintenance: (req: Request, res: Response, next: NextFunction) => void;
    createBackup: (req: Request, res: Response, next: NextFunction) => void;
    listBackups: (req: Request, res: Response, next: NextFunction) => void;
    restoreBackup: (req: Request, res: Response, next: NextFunction) => void;
    deleteBackup: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=AdminController.d.ts.map