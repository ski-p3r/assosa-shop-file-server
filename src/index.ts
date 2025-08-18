import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

dotenv.config();
const app = express();
const PORT = process.env.PORT;

import uploadRouter from './upload.route';
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use('/api', uploadRouter);

app.listen(Number(PORT), () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
