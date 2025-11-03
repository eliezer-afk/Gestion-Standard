import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/controllers/BaseController';
import { Customer } from './Customer.entity';
import { CustomerService } from './Customer.service';

export class CustomerController extends BaseController<Customer> {
    constructor(service: CustomerService) {
        super(service);
    }

    getByEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.params;
            const customer = await (this.service as CustomerService).getByEmail(email);

            if (!customer) {
                return res.status(404).json({
                    success: false,
                    message: 'Customer not found'
                });
            }

            res.json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    };

    getByType = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { type } = req.params;

            if (!['individual', 'business'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid customer type'
                });
            }

            const customers = await (this.service as CustomerService).getByType(
                type as 'individual' | 'business'
            );

            res.json({ success: true, data: customers, count: customers.length });
        } catch (error) {
            next(error);
        }
    };

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const { status } = req.body;

            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status must be "active" or "inactive"'
                });
            }

            const customer = await (this.service as CustomerService).updateStatus(id, status);
            res.json({ success: true, data: customer });
        } catch (error) {
            next(error);
        }
    };

    search = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query parameter "q" is required'
                });
            }

            const customers = await (this.service as CustomerService).searchByName(q);
            res.json({ success: true, data: customers, count: customers.length });
        } catch (error) {
            next(error);
        }
    };

    getStatistics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await (this.service as CustomerService).getStatistics();
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    };
}