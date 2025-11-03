export class QueryBuilder {
    private conditions: string[] = [];
    private values: any[] = [];
    private paramIndex: number = 1;

    addCondition(field: string, value: any, operator: string = '='): this {
        if (value !== undefined && value !== null) {
            this.conditions.push(`${field} ${operator} $${this.paramIndex++}`);
            this.values.push(value);
        }
        return this;
    }

    addLike(field: string, value: string): this {
        if (value) {
            this.conditions.push(`${field} ILIKE $${this.paramIndex++}`);
            this.values.push(`%${value}%`);
        }
        return this;
    }

    addIn(field: string, values: any[]): this {
        if (values && values.length > 0) {
            const placeholders = values.map(() => `$${this.paramIndex++}`).join(', ');
            this.conditions.push(`${field} IN (${placeholders})`);
            this.values.push(...values);
        }
        return this;
    }

    addDateRange(field: string, from?: Date, to?: Date): this {
        if (from) {
            this.conditions.push(`${field} >= $${this.paramIndex++}`);
            this.values.push(from);
        }
        if (to) {
            this.conditions.push(`${field} <= $${this.paramIndex++}`);
            this.values.push(to);
        }
        return this;
    }

    build(): { where: string; values: any[] } {
        return {
            where: this.conditions.length > 0
                ? `WHERE ${this.conditions.join(' AND ')}`
                : '',
            values: this.values,
        };
    }
}