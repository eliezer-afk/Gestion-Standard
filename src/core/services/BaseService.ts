export abstract class BaseService<T extends BaseEntity> {
    constructor(protected repository: IBaseRepository<T>) { }

    async getAll(filters?: Partial<T>): Promise<T[]> {
        return await this.repository.findAll(filters);
    }

    async getById(id: number): Promise<T | null> {
        const entity = await this.repository.findById(id);
        if (!entity) {
            throw new Error(`Entity with id ${id} not found`);
        }
        return entity;
    }

    async create(data: Partial<T>): Promise<T> {
        this.validateCreate(data);
        return await this.repository.create(data);
    }

    async update(id: number, data: Partial<T>): Promise<T | null> {
        await this.getById(id); // Verifica que existe
        this.validateUpdate(data);
        return await this.repository.update(id, data);
    }

    async delete(id: number): Promise<boolean> {
        await this.getById(id); // Verifica que existe
        return await this.repository.softDelete(id);
    }

    protected abstract validateCreate(data: Partial<T>): void;
    protected abstract validateUpdate(data: Partial<T>): void;
}