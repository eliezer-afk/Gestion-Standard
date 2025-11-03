import { BaseService } from '../../core/services/BaseService';
import { Order, OrderStatus } from './Order.entity';
import { OrderRepository } from './Order.repository';
import { WhatsAppService } from '../../shared/services/WhatsAppService';

export class OrderService extends BaseService<Order> {
    private whatsappService: WhatsAppService;

    constructor(
        repository: OrderRepository,
        whatsappService: WhatsAppService
    ) {
        super(repository);
        this.whatsappService = whatsappService;
    }

    protected validateCreate(data: Partial<Order>): void {
        if (!data.customerName || data.customerName.trim().length === 0) {
            throw new Error('Customer name is required');
        }

        if (!data.customerPhone || data.customerPhone.trim().length === 0) {
            throw new Error('Customer phone is required');
        }

        if (!data.items || data.items.length === 0) {
            throw new Error('Order must have at least one item');
        }

        // Validar que el total sea correcto
        const calculatedTotal = data.items.reduce((sum, item) => sum + item.subtotal, 0);
        if (Math.abs(calculatedTotal - (data.total || 0)) > 0.01) {
            throw new Error('Total amount mismatch');
        }
    }

    protected validateUpdate(data: Partial<Order>): void {
        if (data.items && data.items.length === 0) {
            throw new Error('Order must have at least one item');
        }
    }

    async create(data: Partial<Order>): Promise<Order> {
        // Calcular total si no viene
        if (!data.total && data.items) {
            data.total = data.items.reduce((sum, item) => sum + item.subtotal, 0);
        }

        const order = await super.create(data);

        // Enviar notificación de WhatsApp
        try {
            await this.whatsappService.sendOrderConfirmation(order);
        } catch (error) {
            console.error('Failed to send WhatsApp notification:', error);
            // No fallar la creación si falla el envío
        }

        return order;
    }

    async updateStatus(
        id: number,
        status: OrderStatus,
        notes?: string
    ): Promise<Order> {
        const currentOrder = await this.getById(id);
        if (!currentOrder) {
            throw new Error('Order not found');
        }

        const oldStatus = currentOrder.status!;

        // Actualizar el estado
        const updatedOrder = await (this.repository as OrderRepository).updateStatus(
            id,
            status,
            notes
        );

        if (!updatedOrder) {
            throw new Error('Failed to update order status');
        }

        // Enviar notificación solo si cambió el estado
        if (oldStatus !== status) {
            try {
                await this.whatsappService.sendStatusUpdate(updatedOrder, oldStatus);
            } catch (error) {
                console.error('Failed to send WhatsApp notification:', error);
            }
        }

        return updatedOrder;
    }

    async addAttachment(id: number, fileUrl: string): Promise<Order> {
        const order = await (this.repository as OrderRepository).addAttachment(id, fileUrl);
        if (!order) {
            throw new Error('Order not found');
        }
        return order;
    }

    async getByOrderNumber(orderNumber: string): Promise<Order | null> {
        return await (this.repository as OrderRepository).findByOrderNumber(orderNumber);
    }

    async getByCustomer(customerId: number): Promise<Order[]> {
        return await (this.repository as OrderRepository).findByCustomer(customerId);
    }

    async getByStatus(status: OrderStatus): Promise<Order[]> {
        return await (this.repository as OrderRepository).findByStatus(status);
    }
}