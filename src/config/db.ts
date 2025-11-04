import { Sequelize } from 'sequelize-typescript';
import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface DatabaseConfig {
    url?: string;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
}

class Database {
    sync() {
        throw new Error('Method not implemented.');
    }
    authenticate() {
        throw new Error('Method not implemented.');
    }
    private static instance: Database;
    private sequelize?: Sequelize;
    private pool: Pool;
    private config: DatabaseConfig;

    private constructor() {
        // Parsear configuración
        this.config = this.parseConfig();

        // Inicializar Pool (siempre)
        this.pool = this.initializePool();

        // Inicializar Sequelize (solo si tienes modelos)
        if (this.hasModels()) {
            this.sequelize = this.initializeSequelize();
        }
    }

    private parseConfig(): DatabaseConfig {
        if (process.env.DATABASE_URL) {
            return this.parseConnectionString(process.env.DATABASE_URL);
        }

        return {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME || 'management_system',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
        };
    }

    private parseConnectionString(url: string): DatabaseConfig {
        const urlObj = new URL(url);
        return {
            url,
            host: urlObj.hostname,
            port: parseInt(urlObj.port || '5432'),
            database: urlObj.pathname.slice(1),
            user: urlObj.username,
            password: urlObj.password,
        };
    }

    private initializePool(): Pool {
        const pool = new Pool({
            connectionString: this.config.url,
            host: this.config.host,
            port: this.config.port,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            max: 20,
            min: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            ssl: process.env.NODE_ENV === 'production' ? {
                rejectUnauthorized: false
            } : undefined,
        });

        pool.on('error', (err) => {
            console.error('❌ Unexpected error on idle client', err);
        });

        return pool;
    }

    private initializeSequelize(): Sequelize {
        const modelsPath = path.join(__dirname, '../models');

        return new Sequelize(
            this.config.url || this.buildSequelizeUrl(),
            {
                models: [modelsPath + '/**/*.ts', modelsPath + '/**/*.js'],
                logging: process.env.NODE_ENV === 'development' ? console.log : false,
                dialect: 'postgres',
                dialectOptions: {
                    ssl: process.env.NODE_ENV === 'production' ? {
                        require: true,
                        rejectUnauthorized: false
                    } : false
                },
                pool: {
                    max: 10,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            }
        );
    }

    private buildSequelizeUrl(): string {
        const { user, password, host, port, database } = this.config;
        return `postgres://${user}:${password}@${host}:${port}/${database}`;
    }

    private hasModels(): boolean {
        // Verificar si existe la carpeta de modelos
        const fs = require('fs');
        const modelsPath = path.join(__dirname, '../models');
        return fs.existsSync(modelsPath);
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    // Getters
    public getPool(): Pool {
        return this.pool;
    }

    public getSequelize(): Sequelize | undefined {
        return this.sequelize;
    }

    // Conexión
    public async connect(): Promise<void> {
        try {
            // Test Pool
            const poolResult = await this.pool.query('SELECT NOW(), version() as pg_version');
            console.log('✅ Pool connection established');
            console.log(`📅 Server time: ${poolResult.rows[0].now}`);
            console.log(`🐘 PostgreSQL: ${poolResult.rows[0].pg_version.split(',')[0]}`);

            // Test Sequelize (si está disponible)
            if (this.sequelize) {
                await this.sequelize.authenticate();
                console.log('✅ Sequelize connection established');

                if (process.env.NODE_ENV === 'development') {
                    await this.sequelize.sync({ alter: false });
                    console.log('✅ Models synchronized');
                }
            }
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        try {
            if (this.sequelize) {
                await this.sequelize.close();
            }
            await this.pool.end();
            console.log('👋 Database connections closed');
        } catch (error) {
            console.error('❌ Error closing connections:', error);
            throw error;
        }
    }

    // Métodos útiles
    public async query(sql: string, values?: any[]): Promise<any> {
        return this.pool.query(sql, values);
    }

    public async transaction<T>(
        callback: (client: PoolClient) => Promise<T>
    ): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    public async healthCheck(): Promise<{
        pool: boolean;
        sequelize: boolean;
        timestamp: Date;
    }> {
        const result = {
            pool: false,
            sequelize: false,
            timestamp: new Date()
        };

        try {
            await this.pool.query('SELECT 1');
            result.pool = true;
        } catch (error) {
            console.error('Pool health check failed:', error);
        }

        if (this.sequelize) {
            try {
                await this.sequelize.authenticate();
                result.sequelize = true;
            } catch (error) {
                console.error('Sequelize health check failed:', error);
            }
        }

        return result;
    }
}

export const database = Database.getInstance();
export default database;