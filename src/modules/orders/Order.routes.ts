import { Router } from 'express';
import { OrderController } from './Order.controller';

export const createOrderRoutes = (controller: OrderController): Router => {
    const router = Router();

    // Rutas públicas
    router.get('/track/:orderNumber', controller.trackOrder);

    // Rutas CRUD básicas
    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);
    router.post('/', controller.getUploadMiddleware(), controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    // Rutas específicas
    router.patch('/:id/status', controller.updateStatus);
    router.post('/:id/upload', controller.getUploadMiddleware(), controller.uploadFiles);
    router.get('/customer/:customerId', controller.getByCustomer);
    router.get('/status/:status', controller.getByStatus);

    return router;
};