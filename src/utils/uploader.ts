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
const CURRENT_IP = process.env.CURRENT_IP!;
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
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
        await minioClient.makeBucket(BUCKET, 'us-east-1');
    }
    const objectName = Date.now() + '-' + file.originalname;
    await minioClient.putObject(BUCKET, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
    });
    const protocol = req && req.protocol ? req.protocol : 'http';
    const fullUrl = `${protocol}://${CURRENT_IP}/${BUCKET}/${objectName}`;
    return {
        url: fullUrl,
        objectName,
        bucket: BUCKET,
    };
}
