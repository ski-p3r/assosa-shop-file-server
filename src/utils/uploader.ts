import { Client } from 'minio';
import dotenv from 'dotenv';
dotenv.config();

const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT!,
    port: Number(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
});
const ENDPOINT = process.env.MINIO_ENDPOINT!;
const PORT = Number(process.env.MINIO_PORT);
const BUCKET = process.env.MINIO_BUCKET!;
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN!;

export async function uploadToMinio(
    file: Express.Multer.File,
    token: string,
    req?: any
) {
    if (token !== UPLOAD_TOKEN) {
        throw new Error('Invalid upload token');
    }
    // Ensure bucket exists
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
        await minioClient.makeBucket(BUCKET, 'us-east-1');
    }
    const objectName = Date.now() + '-' + file.originalname;
    await minioClient.putObject(BUCKET, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
    });
    // Build full URL
    let host = process.env.HOST;
    let port = process.env.PORT;
    if (req && req.protocol && req.get) {
        host = req.get('host');
        port = '';
    }
    const protocol = req && req.protocol ? req.protocol : 'http';
    const fullUrl = `${protocol}://${ENDPOINT}${
        PORT && String(PORT) !== '80' && String(PORT) !== '443'
            ? `:${PORT}`
            : ''
    }/${BUCKET}/${objectName}`;
    return {
        url: fullUrl,
        objectName,
        bucket: BUCKET,
    };
}
