import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadToMinio } from './utils/uploader';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post(
    '/upload',
    upload.single('file'),
    async (req: Request, res: Response) => {
        const token = req.headers['x-upload-token'] || req.body.token;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!token || typeof token !== 'string') {
            return res.status(401).json({ error: 'Missing or invalid token' });
        }
        try {
            const result = await uploadToMinio(req.file, token, req);
            res.json({ success: true, ...result });
        } catch (err: any) {
            res.status(401).json({ error: err.message });
        }
    }
);

router.post('/generate-invoice', async (req: Request, res: Response) => {
    try {
        const { generateInvoice } = await import('./utils/generator');
        await generateInvoice(req, res);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
