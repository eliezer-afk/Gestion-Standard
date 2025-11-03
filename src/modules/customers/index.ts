import { Pool } from 'pg';
import { CustomerRepository } from './Customer.repository';
import { CustomerService } from './Customer.service';
import { CustomerController } from './Customer.controller';
import { createCustomerRoutes } from './Customer.routes';

export class CustomerModule {
    public controller: CustomerController;
    public service: CustomerService;
    public repository: CustomerRepository;
    public router;

    constructor(pool: Pool) {
        this.repository = new CustomerRepository(pool);
        this.service = new CustomerService(this.repository);
        this.controller = new CustomerController(this.service);
        this.router = createCustomerRoutes(this.controller);
    }
}