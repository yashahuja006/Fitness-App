import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    register: (req: Request, res: Response, next: NextFunction) => void;
    login: (req: Request, res: Response, next: NextFunction) => void;
    refreshToken: (req: Request, res: Response, next: NextFunction) => void;
    resetPassword: (req: Request, res: Response, next: NextFunction) => void;
    verifyEmail: (req: Request, res: Response, next: NextFunction) => void;
    logout: (req: Request, res: Response, next: NextFunction) => void;
    getProfile: (req: Request, res: Response, next: NextFunction) => void;
    updateProfile: (req: Request, res: Response, next: NextFunction) => void;
    deleteAccount: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=AuthController.d.ts.map