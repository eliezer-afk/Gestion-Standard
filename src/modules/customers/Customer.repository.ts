import { Pool } from 'pg';
import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Customer } from './Customer.entity';

export class CustomerRepository extends BaseRepository<Customer> {
    constructor(pool: Pool) {
        super(pool, 'customers');
    }

    protected mapToEntity(row: any): Customer {
        return new Customer({
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            type: row.type,
            taxId: row.tax_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        });
    }

    // Métodos específicos del dominio
    async findByEmail(email: string): Promise<Customer | null> {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE email = $1 AND deleted_at IS NULL
    `;
        const result = await this.pool.query(query, [email]);
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async findByType(type: 'individual' | 'business'): Promise<Customer[]> {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE type = $1 AND deleted_at IS NULL
      ORDER BY name ASC
    `;
        const result = await this.pool.query(query, [type]);
        return result.rows.map(row => this.mapToEntity(row));
    }

    async updateStatus(id: number, status: 'active' | 'inactive'): Promise<Customer | null> {
        const query = `
      UPDATE ${this.tableName}
      SET status = $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
        const result = await this.pool.query(query, [id, status]);
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async searchByName(searchTerm: string): Promise<Customer[]> {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE name ILIKE $1 AND deleted_at IS NULL
      ORDER BY name ASC
    `;
        const result = await this.pool.query(query, [`%${searchTerm}%`]);
        return result.rows.map(row => this.mapToEntity(row));
    }

    async getStatistics(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byType: { individual: number; business: number };
    }> {
        const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE type = 'individual') as individual,
        COUNT(*) FILTER (WHERE type = 'business') as business
      FROM ${this.tableName}
      WHERE deleted_at IS NULL
    `;
        const result = await this.pool.query(query);
        const row = result.rows[0];

        return {
            total: parseInt(row.total),
            active: parseInt(row.active),
            inactive: parseInt(row.inactive),
            byType: {
                individual: parseInt(row.individual),
                business: parseInt(row.business)
            }
        };
    }
}