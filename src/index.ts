import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
app.use('/files', express.static(path.resolve(UPLOAD_DIR)));

import router from './upload.route';

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use('/api', router);

app.listen(Number(PORT), () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
