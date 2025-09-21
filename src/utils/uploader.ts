import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import type { Express } from 'express';
dotenv.config();

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN!;
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8001';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function uploadToLocal(
    file: Express.Multer.File,
    token: string,
    req?: any
) {
    if (token !== UPLOAD_TOKEN) {
        throw new Error('Invalid upload token');
    }

    const objectName = Date.now() + '-' + file.originalname;
    const filePath = path.join(UPLOAD_DIR, objectName);

    // Write file to local storage
    fs.writeFileSync(filePath, file.buffer);

    const fullUrl = `${SERVER_URL}/files/${objectName}`;
    return {
        url: fullUrl,
        objectName,
        filePath,
    };
}

// Keep backward compatibility by exporting with original name
export const uploadToMinio = uploadToLocal;
