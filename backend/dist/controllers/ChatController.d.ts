import { Request, Response, NextFunction } from 'express';
export declare class ChatController {
    getChatSessions: (req: Request, res: Response, next: NextFunction) => void;
    createChatSession: (req: Request, res: Response, next: NextFunction) => void;
    getChatSession: (req: Request, res: Response, next: NextFunction) => void;
    deleteChatSession: (req: Request, res: Response, next: NextFunction) => void;
    sendMessage: (req: Request, res: Response, next: NextFunction) => void;
    getMessages: (req: Request, res: Response, next: NextFunction) => void;
    getSuggestions: (req: Request, res: Response, next: NextFunction) => void;
    quickExerciseSearch: (req: Request, res: Response, next: NextFunction) => void;
    getWorkoutHelp: (req: Request, res: Response, next: NextFunction) => void;
    getFormGuidance: (req: Request, res: Response, next: NextFunction) => void;
    getChatContext: (req: Request, res: Response, next: NextFunction) => void;
    updateChatContext: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=ChatController.d.ts.map