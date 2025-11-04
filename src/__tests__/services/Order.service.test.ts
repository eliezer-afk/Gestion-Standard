import { OrderService } from '../../modules/orders/Order.service';
import { OrderRepository } from '../../modules/orders/Order.repository';
import { WhatsAppService } from '../../shared/services/WhatsAppService';
import { Order, OrderStatus } from '../../modules/orders/Order.entity';
import { Pool } from 'pg';

// Mock de los servicios
jest.mock('../../modules/orders/Order.repository');
jest.mock('../../shared/services/WhatsAppService');

describe('OrderService', () => {
    let orderService: OrderService;
    let orderRepository: jest.Mocked<OrderRepository>;
    let whatsappService: jest.Mocked<WhatsAppService>;
    let mockPool: jest.Mocked<Pool>;

    beforeEach(() => {
        // Limpiar todos los mocks
        jest.clearAllMocks();

        // Mock del Pool de PostgreSQL
        mockPool = {
            query: jest.fn(),
            connect: jest.fn(),
            end: jest.fn(),
        } as any;

        // Crear instancia mockeada del repositorio
        orderRepository = new OrderRepository(mockPool) as jest.Mocked<OrderRepository>;

        // Crear instancia mockeada del servicio WhatsApp
        whatsappService = new WhatsAppService() as jest.Mocked<WhatsAppService>;

        // Crear instancia del servicio con dependencias mockeadas
        orderService = new OrderService(orderRepository, whatsappService);

        // Mock de los métodos del repositorio
        orderRepository.findAll = jest.fn();
        orderRepository.findById = jest.fn();
        orderRepository.create = jest.fn();
        orderRepository.update = jest.fn();
        orderRepository.softDelete = jest.fn();
        orderRepository.updateStatus = jest.fn();

        // Mock de los métodos del WhatsApp service
        whatsappService.sendOrderConfirmation = jest.fn();
        whatsappService.sendStatusUpdate = jest.fn();
    });

    describe('getAll', () => {
        it('should return all orders', async () => {
            // Arrange
            const mockOrders = [
                new Order({
                    id: 1,
                    customerId: 1,
                    customerName: 'John Doe',
                    customerPhone: '+5492611234567',
                    total: 100,
                    status: OrderStatus.PENDING
                }),
                new Order({
                    id: 2,
                    customerId: 2,
                    customerName: 'Jane Smith',
                    customerPhone: '+5492611234568',
                    total: 200,
                    status: OrderStatus.CONFIRMED
                })
            ];
            orderRepository.findAll.mockResolvedValue(mockOrders);

            // Act
            const result = await orderService.getAll();

            // Assert
            expect(result).toEqual(mockOrders);
            expect(orderRepository.findAll).toHaveBeenCalledTimes(1);
        });

        it('should pass filters to repository', async () => {
            // Arrange
            const filters = { status: OrderStatus.PENDING };
            orderRepository.findAll.mockResolvedValue([]);

            // Act
            await orderService.getAll(filters);

            // Assert
            expect(orderRepository.findAll).toHaveBeenCalledWith(filters);
        });

        it('should handle errors when getting all orders', async () => {
            // Arrange
            const error = new Error('Database error');
            orderRepository.findAll.mockRejectedValue(error);

            // Act & Assert
            await expect(orderService.getAll()).rejects.toThrow('Database error');
        });
    });

    describe('getById', () => {
        it('should return order by id', async () => {
            // Arrange
            const mockOrder = new Order({
                id: 1,
                customerId: 1,
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                total: 100
            });
            orderRepository.findById.mockResolvedValue(mockOrder);

            // Act
            const result = await orderService.getById(1);

            // Assert
            expect(result).toEqual(mockOrder);
            expect(orderRepository.findById).toHaveBeenCalledWith(1);
        });

        it('should throw error for non-existent order', async () => {
            // Arrange
            orderRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(orderService.getById(999)).rejects.toThrow('Entity with id 999 not found');
        });
    });

    describe('create', () => {
        it('should create new order and send WhatsApp notification', async () => {
            // Arrange
            const orderData = {
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                customerEmail: 'john@example.com',
                items: [
                    {
                        productId: 1,
                        productName: 'Product A',
                        quantity: 2,
                        price: 50,
                        subtotal: 100
                    }
                ],
                total: 100
            };

            const mockOrder = new Order({
                id: 1,
                orderNumber: 'ORD240100001',
                ...orderData,
                status: OrderStatus.PENDING,
                trackingUrl: 'http://localhost:3000/track/ORD240100001'
            });

            orderRepository.create.mockResolvedValue(mockOrder);
            whatsappService.sendOrderConfirmation.mockResolvedValue(true);

            // Act
            const result = await orderService.create(orderData);

            // Assert
            expect(result).toEqual(mockOrder);
            expect(orderRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    customerName: orderData.customerName,
                    total: orderData.total
                })
            );
            expect(whatsappService.sendOrderConfirmation).toHaveBeenCalledWith(mockOrder);
        });

        it('should throw error if customer name is missing', async () => {
            // Arrange
            const orderData = {
                customerPhone: '+5492611234567',
                items: [{ productId: 1, productName: 'Test', quantity: 1, price: 100, subtotal: 100 }],
                total: 100
            } as any;

            // Act & Assert
            await expect(orderService.create(orderData)).rejects.toThrow('Customer name is required');
        });

        it('should throw error if customer phone is missing', async () => {
            // Arrange
            const orderData = {
                customerName: 'John Doe',
                items: [{ productId: 1, productName: 'Test', quantity: 1, price: 100, subtotal: 100 }],
                total: 100
            } as any;

            // Act & Assert
            await expect(orderService.create(orderData)).rejects.toThrow('Customer phone is required');
        });

        it('should throw error if items are empty', async () => {
            // Arrange
            const orderData = {
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                items: [],
                total: 0
            };

            // Act & Assert
            await expect(orderService.create(orderData)).rejects.toThrow('Order must have at least one item');
        });

        it('should calculate total if not provided', async () => {
            // Arrange
            const orderData = {
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                items: [
                    { productId: 1, productName: 'Product A', quantity: 2, price: 50, subtotal: 100 },
                    { productId: 2, productName: 'Product B', quantity: 1, price: 75, subtotal: 75 }
                ]
            };

            const mockOrder = new Order({ id: 1, ...orderData, total: 175 });
            orderRepository.create.mockResolvedValue(mockOrder);
            whatsappService.sendOrderConfirmation.mockResolvedValue(true);

            // Act
            const result = await orderService.create(orderData);

            // Assert
            expect(result.total).toBe(175);
        });

        it('should continue even if WhatsApp fails', async () => {
            // Arrange
            const orderData = {
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                items: [{ productId: 1, productName: 'Test', quantity: 1, price: 100, subtotal: 100 }],
                total: 100
            };

            const mockOrder = new Order({ id: 1, ...orderData });
            orderRepository.create.mockResolvedValue(mockOrder);
            whatsappService.sendOrderConfirmation.mockRejectedValue(new Error('WhatsApp error'));

            // Act
            const result = await orderService.create(orderData);

            // Assert
            expect(result).toEqual(mockOrder);
        });
    });

    describe('update', () => {
        it('should update existing order', async () => {
            // Arrange
            const orderId = 1;
            const updateData = { notes: 'Updated notes' };
            const existingOrder = new Order({
                id: orderId,
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                total: 100
            });
            const updatedOrder = new Order({ ...existingOrder, ...updateData });

            orderRepository.findById.mockResolvedValue(existingOrder);
            orderRepository.update.mockResolvedValue(updatedOrder);

            // Act
            const result = await orderService.update(orderId, updateData);

            // Assert
            expect(result).toEqual(updatedOrder);
            expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
            expect(orderRepository.update).toHaveBeenCalledWith(orderId, updateData);
        });

        it('should throw error if order does not exist', async () => {
            // Arrange
            orderRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(orderService.update(999, {})).rejects.toThrow('Entity with id 999 not found');
        });
    });

    describe('delete', () => {
        it('should delete existing order', async () => {
            // Arrange
            const orderId = 1;
            const existingOrder = new Order({
                id: orderId,
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                total: 100
            });

            orderRepository.findById.mockResolvedValue(existingOrder);
            orderRepository.softDelete.mockResolvedValue(true);

            // Act
            const result = await orderService.delete(orderId);

            // Assert
            expect(result).toBe(true);
            expect(orderRepository.findById).toHaveBeenCalledWith(orderId);
            expect(orderRepository.softDelete).toHaveBeenCalledWith(orderId);
        });

        it('should throw error if order does not exist', async () => {
            // Arrange
            orderRepository.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(orderService.delete(999)).rejects.toThrow('Entity with id 999 not found');
        });
    });

    describe('updateStatus', () => {
        it('should update status and send WhatsApp notification', async () => {
            // Arrange
            const orderId = 1;
            const currentOrder = new Order({
                id: orderId,
                orderNumber: 'ORD240100001',
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                status: OrderStatus.PENDING,
                total: 100
            });

            const updatedOrder = new Order({
                ...currentOrder,
                status: OrderStatus.CONFIRMED
            });

            orderRepository.findById.mockResolvedValue(currentOrder);
            orderRepository.updateStatus.mockResolvedValue(updatedOrder);
            whatsappService.sendStatusUpdate.mockResolvedValue(true);

            // Act
            const result = await orderService.updateStatus(
                orderId,
                OrderStatus.CONFIRMED,
                'Order confirmed'
            );

            // Assert
            expect(result.status).toBe(OrderStatus.CONFIRMED);
            expect(orderRepository.updateStatus).toHaveBeenCalledWith(
                orderId,
                OrderStatus.CONFIRMED,
                'Order confirmed'
            );
            expect(whatsappService.sendStatusUpdate).toHaveBeenCalledWith(
                updatedOrder,
                OrderStatus.PENDING
            );
        });

        it('should not send WhatsApp if status did not change', async () => {
            // Arrange
            const orderId = 1;
            const currentOrder = new Order({
                id: orderId,
                status: OrderStatus.CONFIRMED,
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                total: 100
            });

            orderRepository.findById.mockResolvedValue(currentOrder);
            orderRepository.updateStatus.mockResolvedValue(currentOrder);

            // Act
            await orderService.updateStatus(orderId, OrderStatus.CONFIRMED);

            // Assert
            expect(whatsappService.sendStatusUpdate).not.toHaveBeenCalled();
        });
    });
});