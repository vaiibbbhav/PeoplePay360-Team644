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
import { AppError } from './shared/errors';

export const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || true,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'PeoplePay360 Backend',
      timestamp: new Date().toISOString(),
    });
  });

  // Resource-oriented API Module routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/employees', hrRoutes);
  app.use('/api/contracts', contractsRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/time-off', timeoffRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/reports', reportingRoutes);
  app.use('/api/documents', documentsRoutes);
  app.use('/api/policies', documentsRoutes);

  // Direct resource aliases matching GEMINI.md section 9
  app.use('/api/payruns', payrollRoutes);
  app.use('/api/payslips', payrollRoutes);
  app.use('/api/salary-structures', payrollRoutes);

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
    res.status(status).json({ error: err.message });
  });

  return app;
};
