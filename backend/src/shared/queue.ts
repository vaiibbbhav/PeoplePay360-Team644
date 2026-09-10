import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { sendPayslipEmail, PayslipEmailOptions } from './mailer';

export type PayslipEmailJobData = {
  payslipId?: string;
  employeeName: string;
  toEmail: string;
  period: string;
  netSalary: number;
  grossSalary: number;
  totalDeductions: number;
  payrunName: string;
};

const QUEUE_NAME = 'payslip-email-dispatch';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let redisConnection: IORedis | null = null;
let emailQueue: Queue<PayslipEmailJobData> | null = null;
let emailWorker: Worker<PayslipEmailJobData> | null = null;
let isRedisAvailable = false;

// Initialize BullMQ with graceful fallback
const initQueue = () => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  try {
    const connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying if Redis is not running
        }
        return Math.min(times * 100, 1000);
      },
    });

    connection.on('connect', () => {
      isRedisAvailable = true;
      console.info(`[QUEUE] Connected to Redis at ${REDIS_URL} — BullMQ queue active.`);
    });

    connection.on('error', (_err) => {
      if (isRedisAvailable) {
        console.warn('[QUEUE] Lost Redis connection. Falling back to in-process async dispatch.');
      }
      isRedisAvailable = false;
    });

    // Attempt non-blocking connection
    connection.connect().catch(() => {
      isRedisAvailable = false;
    });

    redisConnection = connection;

    emailQueue = new Queue<PayslipEmailJobData>(QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    emailWorker = new Worker<PayslipEmailJobData>(
      QUEUE_NAME,
      async (job: Job<PayslipEmailJobData>) => {
        const result = await sendPayslipEmail(job.data as PayslipEmailOptions);
        if (!result.success && result.error && !result.error.includes('SMTP credentials missing')) {
          throw new Error(result.error);
        }
        return result;
      },
      {
        connection: redisConnection,
        concurrency: 5,
      },
    );

    emailWorker.on('completed', (job) => {
      console.info(`[QUEUE] Payslip email job ${job.id} completed for ${job.data.toEmail}`);
    });

    emailWorker.on('failed', (job, err) => {
      console.error(
        `[QUEUE] Payslip email job ${job?.id} failed for ${job?.data.toEmail}:`,
        err.message,
      );
    });
  } catch (_err: unknown) {
    isRedisAvailable = false;
    console.warn('[QUEUE] Redis client init failed, utilizing in-process async dispatch mode.');
  }
};

// Initialize once
initQueue();

/**
 * Dispatches a list of payslip email jobs.
 * If Redis & BullMQ are available, jobs are enqueued into BullMQ.
 * Otherwise, falls back to an asynchronous in-process queue so local dev / offline demos never fail.
 */
export const queuePayslipEmails = async (
  jobs: PayslipEmailJobData[],
): Promise<{ queuedCount: number; mode: 'bullmq' | 'in_process_async' }> => {
  if (jobs.length === 0) {
    return { queuedCount: 0, mode: isRedisAvailable ? 'bullmq' : 'in_process_async' };
  }

  if (isRedisAvailable && emailQueue) {
    try {
      const bullJobs = jobs.map((job) => ({
        name: 'send-payslip',
        data: job,
      }));

      await emailQueue.addBulk(bullJobs);
      console.info(`[QUEUE] Enqueued ${jobs.length} payslip email jobs via BullMQ.`);
      return { queuedCount: jobs.length, mode: 'bullmq' };
    } catch (err) {
      console.warn('[QUEUE] Failed to add to BullMQ, falling back to in-process async:', err);
    }
  }

  // Resilient fallback: Non-blocking in-process async worker
  setImmediate(async () => {
    console.info(`[ASYNC DISPATCH] Processing ${jobs.length} payslip email jobs in background...`);
    for (const job of jobs) {
      try {
        await sendPayslipEmail(job as PayslipEmailOptions);
      } catch (err) {
        console.error(`[ASYNC DISPATCH] Failed to send to ${job.toEmail}:`, err);
      }
    }
  });

  return { queuedCount: jobs.length, mode: 'in_process_async' };
};
