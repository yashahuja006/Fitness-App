import { Request, Response, NextFunction } from 'express';
export declare class DietController {
    getUserDietPlans: (req: Request, res: Response, next: NextFunction) => void;
    generateDietPlan: (req: Request, res: Response, next: NextFunction) => void;
    getDietPlan: (req: Request, res: Response, next: NextFunction) => void;
    updateDietPlan: (req: Request, res: Response, next: NextFunction) => void;
    deleteDietPlan: (req: Request, res: Response, next: NextFunction) => void;
    getPlanMeals: (req: Request, res: Response, next: NextFunction) => void;
    updateDayMeals: (req: Request, res: Response, next: NextFunction) => void;
    substituteMeal: (req: Request, res: Response, next: NextFunction) => void;
    logFood: (req: Request, res: Response, next: NextFunction) => void;
    getFoodLog: (req: Request, res: Response, next: NextFunction) => void;
    getNutritionSummary: (req: Request, res: Response, next: NextFunction) => void;
    searchRecipes: (req: Request, res: Response, next: NextFunction) => void;
    getRecipe: (req: Request, res: Response, next: NextFunction) => void;
    addRecipeToFavorites: (req: Request, res: Response, next: NextFunction) => void;
    getFavoriteRecipes: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=DietController.d.ts.map