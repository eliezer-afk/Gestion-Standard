export class Product extends BaseEntity {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    category?: string;

    constructor(data?: Partial<Product>) {
        super(data);
        if (data) {
            Object.assign(this, data);
        }
    }
}