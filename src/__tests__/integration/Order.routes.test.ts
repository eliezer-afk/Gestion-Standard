import request from 'supertest';
import server from '../../server';
import { OrderService } from '../../modules/orders/Order.service';

// Mock del servicio
jest.mock('../../modules/orders/Order.service');

describe('Order Routes Integration Tests', () => {
    let mockOrderService: jest.Mocked<OrderService>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        mockOrderService = OrderService as jest.Mocked<any>;
    });

    describe('GET /api/v1/orders', () => {
        it('should return all orders', async () => {
            // Arrange
            const mockOrders = [
                { id: 1, customerId: 1, total: 100 },
                { id: 2, customerId: 2, total: 200 }
            ];
            mockOrderService.getAll.mockResolvedValue(mockOrders);

            // Act
            const response = await request(server)
                .get('/api/v1/orders')
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                success: true,
                data: mockOrders
            });
        });
    });

    describe('GET /api/v1/orders/:id', () => {
        it('should return order by id', async () => {
            // Arrange
            const mockOrder = { id: 1, customerId: 1, total: 100 };
            mockOrderService.getById.mockResolvedValue(mockOrder);

            // Act
            const response = await request(server)
                .get('/api/v1/orders/1')
                .expect('Content-Type', /json/)
                .expect(200);

            // Assert
            expect(response.body).toEqual({
                success: true,
                data: mockOrder
            });
        });

        it('should return 404 for non-existent order', async () => {
            // Arrange
            mockOrderService.getById.mockResolvedValue(null);

            // Act
            const response = await request(server)
                .get('/api/v1/orders/999')
                .expect('Content-Type', /json/)
                .expect(404);

            // Assert
            expect(response.body).toEqual({
                success: false,
                error: 'Order not found'
            });
        });
    });

    describe('POST /api/v1/orders', () => {
        it('should create new order', async () => {
            // Arrange
            const orderData = { customerId: 1, total: 100 };
            const mockOrder = { id: 1, ...orderData };
            mockOrderService.create.mockResolvedValue(mockOrder);

            // Act
            const response = await request(server)
                .post('/api/v1/orders')
                .send(orderData)
                .expect('Content-Type', /json/)
                .expect(201);

            // Assert
            expect(response.body).toEqual({
                success: true,
                data: mockOrder
            });
        });

        it('should validate required fields', async () => {
            // Act
            const response = await request(server)
                .post('/api/v1/orders')
                .send({})
                .expect('Content-Type', /json/)
                .expect(400);

            // Assert
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });
});