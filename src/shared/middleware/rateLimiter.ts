import rateLimit from 'express-rate-limit';

export const createRateLimiter = (
    windowMs: number = 15 * 60 * 1000, // 15 minutos
    max: number = 100 // límite de requests
) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Uso específico para diferentes endpoints
export const apiLimiter = createRateLimiter(15 * 60 * 1000, 100);
export const authLimiter = createRateLimiter(15 * 60 * 1000, 5);
