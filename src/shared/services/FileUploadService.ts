import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class FileUploadService {
    private uploadDir: string;
    private maxFileSize: number;
    private allowedMimeTypes: string[];

    constructor() {
        this.uploadDir = env.UPLOAD_DIR || './uploads';
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        this.ensureUploadDir();
    }

    private async ensureUploadDir(): Promise<void> {
        try {
            await fs.access(this.uploadDir);
        } catch {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    getMulterConfig(): multer.Options {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const orderDir = path.join(this.uploadDir, 'orders');
                try {
                    await fs.access(orderDir);
                } catch {
                    await fs.mkdir(orderDir, { recursive: true });
                }
                cb(null, orderDir);
            },
            filename: (req, file, cb) => {
                const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
                cb(null, uniqueName);
            }
        });

        return {
            storage,
            limits: {
                fileSize: this.maxFileSize
            },
            fileFilter: (req, file, cb) => {
                if (this.allowedMimeTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error(`File type not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`));
                }
            }
        };
    }

    async deleteFile(filePath: string): Promise<boolean> {
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }

    getFileUrl(filename: string): string {
        const baseUrl = env.APP_URL || 'http://localhost:3000';
        return `${baseUrl}/uploads/orders/${filename}`;
    }
}