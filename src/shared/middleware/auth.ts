import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!env.JWT_SECRET) {
            throw new Error('JWT_SECRET not configured');
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as any;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};