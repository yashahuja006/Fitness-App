import { Request, Response, NextFunction } from 'express';
export declare class ExerciseController {
    searchExercises: (req: Request, res: Response, next: NextFunction) => void;
    getExercise: (req: Request, res: Response, next: NextFunction) => void;
    getCategories: (req: Request, res: Response, next: NextFunction) => void;
    getMuscleGroups: (req: Request, res: Response, next: NextFunction) => void;
    getEquipmentTypes: (req: Request, res: Response, next: NextFunction) => void;
    getRecommendations: (req: Request, res: Response, next: NextFunction) => void;
    addToFavorites: (req: Request, res: Response, next: NextFunction) => void;
    removeFromFavorites: (req: Request, res: Response, next: NextFunction) => void;
    getUserFavorites: (req: Request, res: Response, next: NextFunction) => void;
    rateExercise: (req: Request, res: Response, next: NextFunction) => void;
    getExerciseRatings: (req: Request, res: Response, next: NextFunction) => void;
    createExercise: (req: Request, res: Response, next: NextFunction) => void;
    updateExercise: (req: Request, res: Response, next: NextFunction) => void;
    deleteExercise: (req: Request, res: Response, next: NextFunction) => void;
    verifyExercise: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=ExerciseController.d.ts.map