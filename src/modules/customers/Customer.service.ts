import { BaseService } from '../../core/services/BaseService';
import { Customer } from './Customer.entity';
import { CustomerRepository } from './Customer.repository';

export class CustomerService extends BaseService<Customer> {
    constructor(repository: CustomerRepository) {
        super(repository);
    }

    protected validateCreate(data: Partial<Customer>): void {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Customer name is required');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Valid email is required');
        }

        if (!data.type || !['individual', 'business'].includes(data.type)) {
            throw new Error('Customer type must be "individual" or "business"');
        }

        if (data.type === 'business' && !data.taxId) {
            throw new Error('Tax ID is required for business customers');
        }

        if (data.phone && !this.isValidPhone(data.phone)) {
            throw new Error('Invalid phone number format');
        }
    }

    protected validateUpdate(data: Partial<Customer>): void {
        if (data.email && !this.isValidEmail(data.email)) {
            throw new Error('Invalid email format');
        }

        if (data.type && !['individual', 'business'].includes(data.type)) {
            throw new Error('Customer type must be "individual" or "business"');
        }

        if (data.phone && !this.isValidPhone(data.phone)) {
            throw new Error('Invalid phone number format');
        }
    }

    async getByEmail(email: string): Promise<Customer | null> {
        return await (this.repository as CustomerRepository).findByEmail(email);
    }

    async getByType(type: 'individual' | 'business'): Promise<Customer[]> {
        return await (this.repository as CustomerRepository).findByType(type);
    }

    async updateStatus(id: number, status: 'active' | 'inactive'): Promise<Customer | null> {
        const customer = await this.getById(id);
        if (!customer) {
            throw new Error('Customer not found');
        }
        return await (this.repository as CustomerRepository).updateStatus(id, status);
    }

    async searchByName(searchTerm: string): Promise<Customer[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            throw new Error('Search term is required');
        }
        return await (this.repository as CustomerRepository).searchByName(searchTerm);
    }

    async getStatistics() {
        return await (this.repository as CustomerRepository).getStatistics();
    }

    // Validadores auxiliares
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPhone(phone: string): boolean {
        // Acepta formatos: +54 261 1234567, (261) 123-4567, etc.
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
}