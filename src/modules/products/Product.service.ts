export class ProductService extends BaseService<Product> {
    constructor(repository: ProductRepository) {
        super(repository);
    }

    protected validateCreate(data: Partial<Product>): void {
        if (!data.name) throw new Error('Product name is required');
        if (!data.price || data.price <= 0) throw new Error('Invalid price');
        if (data.stock && data.stock < 0) throw new Error('Stock cannot be negative');
    }

    protected validateUpdate(data: Partial<Product>): void {
        if (data.price && data.price <= 0) throw new Error('Invalid price');
        if (data.stock && data.stock < 0) throw new Error('Stock cannot be negative');
    }

    async getByCategory(category: string): Promise<Product[]> {
        return await (this.repository as ProductRepository).findByCategory(category);
    }

    async adjustStock(id: number, quantity: number): Promise<Product | null> {
        return await (this.repository as ProductRepository).updateStock(id, quantity);
    }
}
