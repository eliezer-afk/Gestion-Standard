import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';

type ControllerMethod = (req: Request, res: Response, next: NextFunction) => void;

export const createRoute = (router: Router, method: string, path: string, handler: ControllerMethod) => {
    router[method](path, (req: Request, res: Response, next: NextFunction) => {
        handler(req, res, next);
    });
};