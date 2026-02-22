import { Request, Response, NextFunction } from 'express';
export declare class WorkoutController {
    getUserWorkouts: (req: Request, res: Response, next: NextFunction) => void;
    createWorkout: (req: Request, res: Response, next: NextFunction) => void;
    getWorkout: (req: Request, res: Response, next: NextFunction) => void;
    updateWorkout: (req: Request, res: Response, next: NextFunction) => void;
    deleteWorkout: (req: Request, res: Response, next: NextFunction) => void;
    startWorkout: (req: Request, res: Response, next: NextFunction) => void;
    completeWorkout: (req: Request, res: Response, next: NextFunction) => void;
    pauseWorkout: (req: Request, res: Response, next: NextFunction) => void;
    resumeWorkout: (req: Request, res: Response, next: NextFunction) => void;
    recordSet: (req: Request, res: Response, next: NextFunction) => void;
    recordFormFeedback: (req: Request, res: Response, next: NextFunction) => void;
    getWorkoutTemplates: (req: Request, res: Response, next: NextFunction) => void;
    createWorkoutTemplate: (req: Request, res: Response, next: NextFunction) => void;
    shareWorkout: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=WorkoutController.d.ts.map