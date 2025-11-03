import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../core/controllers/BaseController';
import { Order, OrderStatus } from './Order.entity';
import { OrderService } from './Order.service';
import { FileUploadService } from '../../shared/services/FileUploadService';
import multer from 'multer';

export class OrderController extends BaseController<Order> {
    private fileUploadService: FileUploadService;
    private upload: multer.Multer;

    constructor(service: OrderService, fileUploadService: FileUploadService) {
        super(service);
        this.fileUploadService = fileUploadService;
        this.upload = multer(this.fileUploadService.getMulterConfig());
    }

    getUploadMiddleware() {
        return this.upload.array('files', 5); // Máximo 5 archivos
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Si hay archivos subidos, agregar las URLs
            const files = req.files as Express.Multer.File[];
            if (files && files.length > 0) {
                req.body.attachments = files.map(file =>
                    this.fileUploadService.getFileUrl(file.filename)
                );
            }

            const order = await this.service.create(req.body);
            res.status(201).json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    };

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const { status, notes } = req.body;

            if (!Object.values(OrderStatus).includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status value'
                });
            }

            const order = await (this.service as OrderService).updateStatus(id, status, notes);
            res.json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    };

    trackOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { orderNumber } = req.params;
            const order = await (this.service as OrderService).getByOrderNumber(orderNumber);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    };

    getByCustomer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customerId = parseInt(req.params.customerId);
            const orders = await (this.service as OrderService).getByCustomer(customerId);
            res.json({ success: true, data: orders, count: orders.length });
        } catch (error) {
            next(error);
        }
    };

    getByStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status } = req.params;

            if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            const orders = await (this.service as OrderService).getByStatus(status as OrderStatus);
            res.json({ success: true, data: orders, count: orders.length });
        } catch (error) {
            next(error);
        }
    };

    uploadFiles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            // Agregar cada archivo a la orden
            let order: Order | null = null;
            for (const file of files) {
                const fileUrl = this.fileUploadService.getFileUrl(file.filename);
                order = await (this.service as OrderService).addAttachment(id, fileUrl);
            }

            res.json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    };
}