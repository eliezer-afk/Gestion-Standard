import { Pool } from 'pg';
import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Order, OrderStatus } from './Order.entity';

export class OrderRepository extends BaseRepository<Order> {
    constructor(pool: Pool) {
        super(pool, 'orders');
    }

    protected mapToEntity(row: any): Order {
        return new Order({
            id: row.id,
            orderNumber: row.order_number,
            customerId: row.customer_id,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            customerPhone: row.customer_phone,
            items: row.items ? JSON.parse(row.items) : [],
            total: parseFloat(row.total),
            status: row.status as OrderStatus,
            notes: row.notes,
            attachments: row.attachments ? JSON.parse(row.attachments) : [],
            trackingUrl: row.tracking_url,
            statusHistory: row.status_history ? JSON.parse(row.status_history) : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        });
    }

    async create(data: Partial<Order>): Promise<Order> {
        const orderNumber = await this.generateOrderNumber();
        const trackingUrl = `${process.env.APP_URL || 'http://localhost:3000'}/track/${orderNumber}`;

        const query = `
      INSERT INTO ${this.tableName} (
        order_number, customer_id, customer_name, customer_email, 
        customer_phone, items, total, status, notes, attachments,
        tracking_url, status_history, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

        const statusHistory = [{
            status: OrderStatus.PENDING,
            timestamp: new Date(),
            notes: 'Orden creada'
        }];

        const values = [
            orderNumber,
            data.customerId,
            data.customerName,
            data.customerEmail,
            data.customerPhone,
            JSON.stringify(data.items || []),
            data.total,
            OrderStatus.PENDING,
            data.notes || null,
            JSON.stringify(data.attachments || []),
            trackingUrl,
            JSON.stringify(statusHistory)
        ];

        const result = await this.pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    async updateStatus(
        id: number,
        status: OrderStatus,
        notes?: string
    ): Promise<Order | null> {
        // Primero obtenemos la orden actual
        const current = await this.findById(id);
        if (!current) return null;

        // Actualizamos el historial
        const statusHistory = [
            ...(current.statusHistory || []),
            {
                status,
                timestamp: new Date(),
                notes
            }
        ];

        const query = `
      UPDATE ${this.tableName}
      SET status = $2, status_history = $3, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

        const result = await this.pool.query(query, [
            id,
            status,
            JSON.stringify(statusHistory)
        ]);

        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async addAttachment(id: number, fileUrl: string): Promise<Order | null> {
        const current = await this.findById(id);
        if (!current) return null;

        const attachments = [...(current.attachments || []), fileUrl];

        const query = `
      UPDATE ${this.tableName}
      SET attachments = $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

        const result = await this.pool.query(query, [id, JSON.stringify(attachments)]);
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async findByOrderNumber(orderNumber: string): Promise<Order | null> {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE order_number = $1 AND deleted_at IS NULL
    `;
        const result = await this.pool.query(query, [orderNumber]);
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async findByCustomer(customerId: number): Promise<Order[]> {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE customer_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
        const result = await this.pool.query(query, [customerId]);
        return result.rows.map(row => this.mapToEntity(row));
    }

    async findByStatus(status: OrderStatus): Promise<Order[]> {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;
        const result = await this.pool.query(query, [status]);
        return result.rows.map(row => this.mapToEntity(row));
    }

    private async generateOrderNumber(): Promise<string> {
        const prefix = 'ORD';
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');

        // Obtenemos el último número de orden del mes
        const query = `
      SELECT order_number FROM ${this.tableName}
      WHERE order_number LIKE $1
      ORDER BY created_at DESC
      LIMIT 1
    `;

        const pattern = `${prefix}${year}${month}%`;
        const result = await this.pool.query(query, [pattern]);

        let sequence = 1;
        if (result.rows.length > 0) {
            const lastNumber = result.rows[0].order_number;
            sequence = parseInt(lastNumber.slice(-4)) + 1;
        }

        return `${prefix}${year}${month}${sequence.toString().padStart(4, '0')}`;
    }
}