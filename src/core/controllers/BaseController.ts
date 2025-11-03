import { Request, Response, NextFunction } from 'express';

export abstract class BaseController<T extends BaseEntity> {
    constructor(protected service: BaseService<T>) { }

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = this.extractFilters(req.query);
            const entities = await this.service.getAll(filters);
            res.json({ success: true, data: entities });
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const entity = await this.service.getById(id);
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const entity = await this.service.create(req.body);
            res.status(201).json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const entity = await this.service.update(id, req.body);
            res.json({ success: true, data: entity });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            await this.service.delete(id);
            res.json({ success: true, message: 'Entity deleted successfully' });
        } catch (error) {
            next(error);
        }
    };

    protected extractFilters(query: any): Partial<T> {
        return query as Partial<T>;
    }
}