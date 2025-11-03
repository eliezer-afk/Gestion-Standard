import { Pool, QueryResult } from 'pg';

export interface IBaseRepository<T> {
    findAll(filters?: Partial<T>): Promise<T[]>;
    findById(id: number): Promise<T | null>;
    create(data: Partial<T>): Promise<T>;
    update(id: number, data: Partial<T>): Promise<T | null>;
    softDelete(id: number): Promise<boolean>;
    hardDelete(id: number): Promise<boolean>;
}

export abstract class BaseRepository<T extends BaseEntity> implements IBaseRepository<T> {
    constructor(
        protected pool: Pool,
        protected tableName: string
    ) { }

    async findAll(filters?: Partial<T>): Promise<T[]> {
        let query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`;
        const values: any[] = [];
        let paramIndex = 1;

        if (filters) {
            const conditions = Object.entries(filters)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => {
                    values.push(value);
                    return `${this.toSnakeCase(key)} = $${paramIndex++}`;
                });

            if (conditions.length > 0) {
                query += ` AND ${conditions.join(' AND ')}`;
            }
        }

        query += ' ORDER BY created_at DESC';

        const result = await this.pool.query(query, values);
        return result.rows.map(row => this.mapToEntity(row));
    }

    async findById(id: number): Promise<T | null> {
        const query = `SELECT * FROM ${this.tableName} WHERE id = $1 AND deleted_at IS NULL`;
        const result = await this.pool.query(query, [id]);
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async create(data: Partial<T>): Promise<T> {
        const fields = Object.keys(data).map(key => this.toSnakeCase(key));
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`);

        const query = `
      INSERT INTO ${this.tableName} (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders.join(', ')}, NOW(), NOW())
      RETURNING *
    `;

        const result = await this.pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    async update(id: number, data: Partial<T>): Promise<T | null> {
        const entries = Object.entries(data).filter(([key]) => key !== 'id');
        const setClause = entries
            .map(([key], i) => `${this.toSnakeCase(key)} = $${i + 2}`)
            .join(', ');
        const values = [id, ...entries.map(([_, value]) => value)];

        const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

        const result = await this.pool.query(query, values);
        return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
    }

    async softDelete(id: number): Promise<boolean> {
        const query = `
      UPDATE ${this.tableName}
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;
        const result = await this.pool.query(query, [id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }

    async hardDelete(id: number): Promise<boolean> {
        const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
        const result = await this.pool.query(query, [id]);
        return result.rowCount ? result.rowCount > 0 : false;
    }

    protected toSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    protected toCamelCase(str: string): string {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    protected abstract mapToEntity(row: any): T;
}