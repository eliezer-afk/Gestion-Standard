import { Router } from 'express';
import { BaseController } from '../../core/controllers/BaseController';
import { BaseEntity } from '../../core/entities/BaseEntity';

export const createRouter = <T extends BaseEntity>(
    controller: BaseController<T>,
    additionalRoutes?: (router: Router, controller: any) => void
): Router => {
    const router = Router();

    // Rutas CRUD estándar
    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    // Rutas adicionales específicas del módulo
    if (additionalRoutes) {
        additionalRoutes(router, controller);
    }

    return router;
};
