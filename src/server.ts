import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import colors from 'colors';

import { customerRouter, orderRouter, productRouter } from './routers/router';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/errorHandler';
import { authLimiter } from './shared/middleware/rateLimiter';
import db from './config/db';

// Database connection
export async function connectDB() {
    try {
        db.authenticate();
        db.sync();
        console.log(colors.bgBlue.white('Database connection established successfully'));
    } catch (error) {
        console.error(colors.bgRed.white('Database connection failed:'), error);
        process.exit(1);
    }
}

// Express instance
const server = express();

// Global middleware
server.use(helmet()); // Seguridad
server.use(cors()); // CORS
server.use(compression()); // Compresión de respuestas
server.use(express.json()); // Parse JSON bodies
server.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
server.use(authLimiter); // Rate limiting

// Request logging middleware
server.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

// API Routes
server.use('/api/v1/customers', customerRouter);
server.use('/api/v1/orders', orderRouter);
server.use('/api/v1/products', productRouter);

// Health check route
server.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware - debe ir después de las rutas
server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(colors.red(err.stack || err.message));
    errorHandler(err, req, res, next);
});

// Connect to database
connectDB().catch(err => {
    console.error(colors.bgRed.white('Failed to connect to database:'), err);
    process.exit(1);
});

export default server;