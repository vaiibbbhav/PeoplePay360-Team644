import {
  getWelcomeEmailHtml,
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
  getPayslipEmailHtml,
} from './email-templates';

export type WelcomeEmailOptions = {
  toEmail: string;
  temporaryPassword: string;
  role: string;
  employeeName?: string | null;
  verificationToken?: string;
};

export type VerificationEmailOptions = {
  toEmail: string;
  employeeName?: string | null;
  verificationToken: string;
};

export type PasswordResetEmailOptions = {
  toEmail: string;
  employeeName?: string | null;
  resetToken: string;
};

export type PayslipEmailOptions = {
  toEmail: string;
  employeeName: string;
  period: string;
  netSalary: number;
  grossSalary: number;
  totalDeductions: number;
  payrunName: string;
  payslipId?: string;
};

type SendMailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

const getTransporter = async () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  try {
    // Dynamic import to support environments without nodemailer installed
    const nodemailerModule = await import('nodemailer').catch(() => null);
    const nodemailer = (nodemailerModule as any)?.default || nodemailerModule;
    if (!nodemailer || !nodemailer.createTransport) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } catch {
    return null;
  }
};

const dispatchMail = async (
  to: string,
  subject: string,
  html: string,
  text: string,
  debugDump: string,
): Promise<SendMailResult> => {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || 'PeoplePay360 <noreply@peoplepay360.com>';

  if (!transporter) {
    console.warn('[MAILER] SMTP credentials not configured in .env. Logging email payload:');
    console.log(`[MAILER DUMP] To: ${to} | ${debugDump}`);
    return { success: false, error: 'SMTP credentials missing; logged to console' };
  }

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log(`[MAILER] Email "${subject}" dispatched to ${to} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MAILER] Failed to send email to ${to}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
};

export const sendWelcomeCredentialsEmail = async (
  options: WelcomeEmailOptions,
): Promise<SendMailResult> => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const verificationUrl = options.verificationToken
    ? `${appUrl}/verify-email?token=${options.verificationToken}`
    : `${appUrl}/login`;

  const html = getWelcomeEmailHtml({ ...options, verificationUrl });
  const text = `Welcome to PeoplePay360!\n\nYour account has been created with role ${options.role}.\nEmail: ${options.toEmail}\nTemporary Password: ${options.temporaryPassword}\n\nVerify and sign in: ${verificationUrl}`;

  return dispatchMail(
    options.toEmail,
    'Welcome to PeoplePay360 — Verify Your Email & Credentials',
    html,
    text,
    `Password: ${options.temporaryPassword} | Verify URL: ${verificationUrl}`,
  );
};

export const sendVerificationEmail = async (
  options: VerificationEmailOptions,
): Promise<SendMailResult> => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const verificationUrl = `${appUrl}/verify-email?token=${options.verificationToken}`;

  const html = getVerificationEmailHtml({
    employeeName: options.employeeName,
    verificationUrl,
  });
  const text = `Please verify your email address to activate your PeoplePay360 account:\n${verificationUrl}`;

  return dispatchMail(
    options.toEmail,
    'Verify Your Email Address — PeoplePay360',
    html,
    text,
    `Verify URL: ${verificationUrl}`,
  );
};

export const sendPasswordResetEmail = async (
  options: PasswordResetEmailOptions,
): Promise<SendMailResult> => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const resetUrl = `${appUrl}/reset-password?token=${options.resetToken}`;

  const html = getPasswordResetEmailHtml({
    employeeName: options.employeeName,
    resetUrl,
  });
  const text = `Password Reset Request — PeoplePay360\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`;

  return dispatchMail(
    options.toEmail,
    'Reset Your Password — PeoplePay360',
    html,
    text,
    `Reset URL: ${resetUrl}`,
  );
};

export const sendPayslipEmail = async (
  options: PayslipEmailOptions,
): Promise<SendMailResult> => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const payslipUrl = options.payslipId
    ? `${appUrl}/payslip/${options.payslipId}`
    : `${appUrl}/compensation`;

  const html = getPayslipEmailHtml({ ...options, payslipUrl });
  const text = `Hello ${options.employeeName},\n\nYour payslip for ${options.period} is ready.\nGross: INR ${options.grossSalary}\nDeductions: INR ${options.totalDeductions}\nNet: INR ${options.netSalary}\n\nView at: ${payslipUrl}`;

  return dispatchMail(
    options.toEmail,
    `Your Payslip — ${options.period} | PeoplePay360`,
    html,
    text,
    `Net: ${options.netSalary} | Payslip URL: ${payslipUrl}`,
  );
};
