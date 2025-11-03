import { BaseEntity } from '../../core/entities/BaseEntity';

export class Customer extends BaseEntity {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    type?: 'individual' | 'business';
    taxId?: string;
    status?: 'active' | 'inactive';

    constructor(data?: Partial<Customer>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }
}