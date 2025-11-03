import { Pool } from 'pg';
import { OrderRepository } from './Order.repository';
import { OrderService } from './Order.service';
import { OrderController } from './Order.controller';
import { createOrderRoutes } from './Order.routes';
import { WhatsAppService } from '../../shared/services/WhatsAppService';
import { FileUploadService } from '../../shared/services/FileUploadService';

export class OrderModule {
    public controller: OrderController;
    public service: OrderService;
    public repository: OrderRepository;
    public router;

    constructor(pool: Pool) {
        const whatsappService = new WhatsAppService();
        const fileUploadService = new FileUploadService();

        this.repository = new OrderRepository(pool);
        this.service = new OrderService(this.repository, whatsappService);
        this.controller = new OrderController(this.service, fileUploadService);
        this.router = createOrderRoutes(this.controller);
    }
}