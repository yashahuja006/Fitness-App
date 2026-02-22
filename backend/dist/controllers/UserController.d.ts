import { Request, Response, NextFunction } from 'express';
export declare class UserController {
    getProfile: (req: Request, res: Response, next: NextFunction) => void;
    updateProfile: (req: Request, res: Response, next: NextFunction) => void;
    updatePreferences: (req: Request, res: Response, next: NextFunction) => void;
    updatePersonalMetrics: (req: Request, res: Response, next: NextFunction) => void;
    searchUsers: (req: Request, res: Response, next: NextFunction) => void;
    getPublicProfile: (req: Request, res: Response, next: NextFunction) => void;
    getAllUsers: (req: Request, res: Response, next: NextFunction) => void;
    deleteUser: (req: Request, res: Response, next: NextFunction) => void;
    updateUserRole: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=UserController.d.ts.map