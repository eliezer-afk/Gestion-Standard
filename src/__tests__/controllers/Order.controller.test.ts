import { Request, Response, NextFunction } from 'express';
import { OrderController } from '../../modules/orders/Order.controller';
import { OrderService } from '../../modules/orders/Order.service';
import { FileUploadService } from '../../shared/services/FileUploadService';
import { Order, OrderStatus } from '../../modules/orders/Order.entity';

// Mock de los servicios
jest.mock('../../modules/orders/Order.service');
jest.mock('../../shared/services/FileUploadService');

describe('OrderController', () => {
    let orderController: OrderController;
    let orderService: jest.Mocked<OrderService>;
    let fileUploadService: jest.Mocked<FileUploadService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        // Limpiar mocks
        jest.clearAllMocks();

        // Crear mocks de los servicios
        orderService = {
            getAll: jest.fn(),
            getById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updateStatus: jest.fn(),
            getByOrderNumber: jest.fn(),
            getByCustomer: jest.fn(),
            getByStatus: jest.fn(),
            addAttachment: jest.fn(),
        } as any;

        fileUploadService = {
            getMulterConfig: jest.fn(),
            getFileUrl: jest.fn(),
            deleteFile: jest.fn(),
        } as any;

        // Crear instancia del controlador con servicios mockeados
        orderController = new OrderController(orderService, fileUploadService);

        // Mock de request/response/next
        mockRequest = {
            params: {},
            body: {},
            query: {},
            files: []
        };

        mockResponse = {
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis()
        };

        mockNext = jest.fn();
    });

    describe('getAll', () => {
        it('should return all orders', async () => {
            // Arrange
            const mockOrders = [
                new Order({ id: 1, customerName: 'John', customerPhone: '+123', total: 100 }),
                new Order({ id: 2, customerName: 'Jane', customerPhone: '+456', total: 200 })
            ];
            orderService.getAll.mockResolvedValue(mockOrders);

            // Act
            await orderController.getAll(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockOrders
            });
            expect(orderService.getAll).toHaveBeenCalled();
        });

        it('should handle errors', async () => {
            // Arrange
            const error = new Error('Service error');
            orderService.getAll.mockRejectedValue(error);

            // Act
            await orderController.getAll(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('getById', () => {
        it('should return order by id', async () => {
            // Arrange
            const mockOrder = new Order({
                id: 1,
                customerName: 'John',
                customerPhone: '+123',
                total: 100
            });
            mockRequest.params = { id: '1' };
            orderService.getById.mockResolvedValue(mockOrder);

            // Act
            await orderController.getById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockOrder
            });
            expect(orderService.getById).toHaveBeenCalledWith(1);
        });

        it('should handle error when order not found', async () => {
            // Arrange
            mockRequest.params = { id: '999' };
            const error = new Error('Entity with id 999 not found');
            orderService.getById.mockRejectedValue(error);

            // Act
            await orderController.getById(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    describe('create', () => {
        it('should create new order without files', async () => {
            // Arrange
            const orderData = {
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                items: [{ productId: 1, productName: 'Test', quantity: 1, price: 100, subtotal: 100 }],
                total: 100
            };
            const mockOrder = new Order({ id: 1, ...orderData });
            mockRequest.body = orderData;
            orderService.create.mockResolvedValue(mockOrder);

            // Act
            await orderController.create(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockOrder
            });
            expect(orderService.create).toHaveBeenCalledWith(orderData);
        });

        it('should create order with files', async () => {
            // Arrange
            const orderData = {
                customerName: 'John Doe',
                customerPhone: '+5492611234567',
                items: [{ productId: 1, productName: 'Test', quantity: 1, price: 100, subtotal: 100 }],
                total: 100
            };

            const mockFiles = [
                { filename: 'file1.jpg' },
                { filename: 'file2.pdf' }
            ] as Express.Multer.File[];

            mockRequest.body = orderData;
            mockRequest.files = mockFiles;

            fileUploadService.getFileUrl.mockImplementation(
                (filename) => `http://localhost:3000/uploads/${filename}`
            );

            const mockOrder = new Order({
                id: 1,
                ...orderData,
                attachments: [
                    'http://localhost:3000/uploads/file1.jpg',
                    'http://localhost:3000/uploads/file2.pdf'
                ]
            });

            orderService.create.mockResolvedValue(mockOrder);

            // Act
            await orderController.create(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(orderService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    attachments: [
                        'http://localhost:3000/uploads/file1.jpg',
                        'http://localhost:3000/uploads/file2.pdf'
                    ]
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });
    });

    describe('updateStatus', () => {
        it('should update order status', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                status: OrderStatus.CONFIRMED,
                notes: 'Order confirmed'
            };

            const mockOrder = new Order({
                id: 1,
                status: OrderStatus.CONFIRMED,
                customerName: 'John',
                customerPhone: '+123',
                total: 100
            });

            orderService.updateStatus.mockResolvedValue(mockOrder);

            // Act
            await orderController.updateStatus(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(orderService.updateStatus).toHaveBeenCalledWith(
                1,
                OrderStatus.CONFIRMED,
                'Order confirmed'
            );
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockOrder
            });
        });

        it('should return 400 for invalid status', async () => {
            // Arrange
            mockRequest.params = { id: '1' };
            mockRequest.body = { status: 'invalid_status' };

            // Act
            await orderController.updateStatus(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid status value'
            });
            expect(orderService.updateStatus).not.toHaveBeenCalled();
        });
    });

    describe('trackOrder', () => {
        it('should return order by order number', async () => {
            // Arrange
            const mockOrder = new Order({
                id: 1,
                orderNumber: 'ORD240100001',
                customerName: 'John',
                customerPhone: '+123',
                total: 100
            });
            mockRequest.params = { orderNumber: 'ORD240100001' };
            orderService.getByOrderNumber.mockResolvedValue(mockOrder);

            // Act
            await orderController.trackOrder(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockOrder
            });
        });

        it('should return 404 if order not found', async () => {
            // Arrange
            mockRequest.params = { orderNumber: 'INVALID' };
            orderService.getByOrderNumber.mockResolvedValue(null);

            // Act
            await orderController.trackOrder(
                mockRequest as Request,
                mockResponse as Response,
                mockNext
            );

            // Assert
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                message: 'Order not found'
            });
        });
    });
});
