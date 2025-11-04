import { Pool } from "pg";
import { BaseRepository } from "../../core/repositories/BaseRepository";
import { Product } from "./Product.entity";

export class ProductRepository extends BaseRepository<Product> {
    constructor(pool: Pool) {
        super(pool, 'products');
    }

    protected mapToEntity(row: any): Product {
        return new Product({
            id: row.id,
            name: row.name,
            description: row.description,
            price: parseFloat(row.price),
            stock: row.stock,
            category: row.category,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at
        });
    }
    // Métodos específicos de productos
    async findByCategory(category: string): Promise<Product[]> {
        const query = `
      SELECT * FROM ${this.tableName}
      WHERE category = $1 AND deleted_at IS NULL
    `;
        const result = await this.pool.query(query, [category]);
        return result.rows.map(row => this.mapToEntity(row));
    }

    async updateStock(id: number, quantity: number): Promise<Product | null> {
        const query = `
      UPDATE ${this.tableName}
      SET stock = stock + $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
        const result = await this.pool.query(query, [id, quantity]);
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }
}
