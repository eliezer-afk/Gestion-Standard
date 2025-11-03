import { BaseEntity } from '../../core/entities/BaseEntity';

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    IN_PROGRESS = 'in_progress',
    READY = 'ready',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}

export interface OrderItem {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export class Order extends BaseEntity {
    orderNumber?: string;
    customerId?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    items?: OrderItem[];
    total?: number;
    status?: OrderStatus;
    notes?: string;
    attachments?: string[]; // URLs de archivos subidos
    trackingUrl?: string;
    statusHistory?: Array<{
        status: OrderStatus;
        timestamp: Date;
        notes?: string;
    }>;

    constructor(data?: Partial<Order>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }
}