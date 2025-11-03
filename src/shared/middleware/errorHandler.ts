export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational: boolean = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof AppError) {
        logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method}`);

        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(env.NODE_ENV === 'development' && { stack: err.stack }),
        });
    }

    // Error inesperado
    logger.error(`500 - ${err.message} - ${req.originalUrl} - ${req.method}`, err);

    return res.status(500).json({
        success: false,
        message: env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};