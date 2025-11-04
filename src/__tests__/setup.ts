import { config } from 'dotenv';
import { Sequelize } from 'sequelize';

// Cargar variables de entorno de test
config({ path: '.env.test' });

// Configuración global para los tests
jest.setTimeout(30000); // 30 segundos timeout

// Variables globales para testing
declare global {
    var testDb: Sequelize;
}

// Configuración antes de todos los tests
beforeAll(async () => {
    // Aquí podrías inicializar conexiones de prueba si es necesario
    console.log('Test suite started');
});

// Configuración antes de cada test
beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
});

// Limpiar después de cada test
afterEach(() => {
    // Limpiar cualquier dato de prueba si es necesario
});

// Limpiar después de todos los tests
afterAll(async () => {
    // Cerrar conexiones y limpiar recursos
    console.log('Test suite finished');
});