import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { dbState } from './config/db.js';
import { errorHandler, notFound } from './middleware/error.js';
import { sendSuccess } from './utils/http.js';
import { authRoutes } from './routes/authRoutes.js';
import { leadRoutes } from './routes/leadRoutes.js';
import { userRoutes } from './routes/userRoutes.js';

export function createApp(env) {
  const app = express();

  app.disable('x-powered-by');
  if (env.isProduction) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (req, res) =>
    sendSuccess(res, { data: { status: 'ok', db: dbState(), uptime: Math.round(process.uptime()) } }),
  );
  app.use('/api/auth', authRoutes(env));
  app.use('/api/leads', leadRoutes(env));
  app.use('/api/users', userRoutes(env));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
