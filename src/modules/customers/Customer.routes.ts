import { Router } from 'express';
import { CustomerController } from './Customer.controller';
import { createRouter } from '../../shared/utils/routerFactory';

export const createCustomerRoutes = (controller: CustomerController): Router => {
    return createRouter<Customer>(controller, (router, ctrl) => {
        // Rutas específicas del dominio de clientes
        router.get('/email/:email', ctrl.getByEmail);
        router.get('/type/:type', ctrl.getByType);
        router.get('/search', ctrl.search);
        router.get('/statistics', ctrl.getStatistics);
        router.patch('/:id/status', ctrl.updateStatus);
    });
};