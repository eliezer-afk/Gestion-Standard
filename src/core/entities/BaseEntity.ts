export abstract class BaseEntity {
    id?: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;

    constructor(data?: Partial<BaseEntity>) {
        if (data) {
            Object.assign(this, data);
        }
    }
}