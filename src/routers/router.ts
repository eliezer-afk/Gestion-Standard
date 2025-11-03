import { Router } from 'express';

export const createRouter = <T extends BaseEntity>(
    controller: BaseController<T>,
    additionalRoutes?: (router: Router, controller: any) => void
): Router => {
    const router = Router();

    router.get('/', controller.getAll);
    router.get('/:id', controller.getById);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);

    if (additionalRoutes) {
        additionalRoutes(router, controller);
    }

    return router;
};