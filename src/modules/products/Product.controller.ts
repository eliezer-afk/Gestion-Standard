import { NextFunction, Request, Response } from "express";
import { BaseController } from "../../core/controllers/BaseController";
import { Product } from "./Product.entity";
import { ProductService } from "./Product.service";

export class ProductController extends BaseController<Product> {
    constructor(service: ProductService) {
        super(service);
    }

    getByCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { category } = req.params;
            const products = await (this.service as ProductService).getByCategory(category);
            res.json({ success: true, data: products });
        } catch (error) {
            next(error);
        }
    };

    adjustStock = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const { quantity } = req.body;
            const product = await (this.service as ProductService).adjustStock(id, quantity);
            res.json({ success: true, data: product });
        } catch (error) {
            next(error);
        }
    };
}