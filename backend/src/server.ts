import { createApp } from './app';
import dotenv from 'dotenv';
import { sendAaravTestPayslipEmail } from './modules/payroll/payroll.service';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.info(`PeoplePay360 Backend running on port ${PORT}`);
  // Dispatch test payslip email for Aarav to devanshnair.05@gmail.com (Triggered at 2026-09-06T04:28:00Z)
  void sendAaravTestPayslipEmail('devanshnair.05@gmail.com');
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.info('HTTP server closed');
    process.exit(0);
  });
});
