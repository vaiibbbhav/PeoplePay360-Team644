import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import hrRoutes from './modules/hr/hr.routes';
import contractsRoutes from './modules/contracts/contracts.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import timeoffRoutes from './modules/timeoff/timeoff.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import reportingRoutes from './modules/reporting/reporting.routes';
import documentsRoutes from './modules/documents/documents.routes';
import schedulesRoutes from './modules/schedules/schedules.routes';
import chatbotRoutes from './modules/chatbot/chatbot.routes';
import queueRoutes from './modules/queue/queue.routes';
import { AppError } from './shared/errors';
import { securityHeaders } from './shared/security';

export const createApp = (): Express => {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(securityHeaders);

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

  // Middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'PeoplePay360 Backend',
      timestamp: new Date().toISOString(),
    });
  });

  // Canonical resource API Module routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/employees', hrRoutes);
  app.use('/api/contracts', contractsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/time-off', timeoffRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/payruns', payrollRoutes);
  app.use('/api/payslips', payrollRoutes);
  app.use('/api/reports', reportingRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api/schedules', schedulesRoutes);
  app.use('/api/chatbot', chatbotRoutes);
  app.use('/api/queue', queueRoutes);

  // 404 handler for unmatched routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Single centralized error-handling middleware (GEMINI.md section 4)
  app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.statusCode || 500;
    if (status === 500) {
      console.error(err);
    }
    res.status(status).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  });

  return app;
};
