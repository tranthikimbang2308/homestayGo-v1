import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import qs from 'qs';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.set('query parser', (str) => qs.parse(str, { arrayLimit: 100 }));
app.set('trust proxy', true);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Chào mừng đến với HomestayGo API', data: { docs: '/api/health' } });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
