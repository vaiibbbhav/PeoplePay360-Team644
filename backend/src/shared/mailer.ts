export type WelcomeEmailOptions = {
  toEmail: string;
  temporaryPassword: string;
  role: string;
  employeeName?: string | null;
  verificationToken?: string;
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
    // @ts-ignore
    const nodemailerModule = await import('nodemailer').catch(() => null);
    const nodemailer = nodemailerModule?.default || nodemailerModule;
    if (!nodemailer || !nodemailer.createTransport) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  } catch {
    return null;
  }
};

export const sendWelcomeCredentialsEmail = async (
  options: WelcomeEmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const { toEmail, temporaryPassword, role, employeeName, verificationToken } = options;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const verificationUrl = verificationToken
    ? `${appUrl}/verify-email?token=${verificationToken}`
    : `${appUrl}/login`;
  const from = process.env.SMTP_FROM || 'PeoplePay360 <noreply@peoplepay360.com>';

  const greeting = employeeName ? `Hello ${employeeName},` : 'Hello,';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to PeoplePay360</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #6A3FA0;">
                      PeoplePay<span style="color: #0f172a;">360</span>
                    </div>
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-top: 4px;">
                      Enterprise HR &amp; Payroll Management
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #0f172a; line-height: 1.3;">
                Your Account Has Been Created
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                An administrator has provisioned your system account on <strong>PeoplePay360</strong> with the role of <strong>${role}</strong>. Below are your temporary sign-in credentials:
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 0 0 28px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="margin-bottom: 14px;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; margin-bottom: 4px;">Login Email</div>
                      <div style="font-size: 15px; font-weight: 600; color: #0f172a; font-family: monospace;">${toEmail}</div>
                    </div>
                    <div>
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; margin-bottom: 4px;">Temporary Password</div>
                      <div style="display: inline-block; background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 6px 12px; font-size: 15px; font-weight: 700; color: #6A3FA0; font-family: 'Courier New', Courier, monospace; letter-spacing: 0.05em;">
                        ${temporaryPassword}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #6A3FA0;">
                    <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Verify Email &amp; Sign In &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                Please click the button above to verify your email address and activate your account. If the button does not work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 28px 0; font-size: 12px; word-break: break-all; color: #6A3FA0;">
                <a href="${verificationUrl}" style="color: #6A3FA0; text-decoration: underline;">${verificationUrl}</a>
              </p>

              <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                <strong>Security Reminder:</strong> For your protection, please log in and change your password in your profile settings. If you did not expect this invitation, please inform your HR administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <div style="font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} PeoplePay360 Inc. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Welcome to PeoplePay360!

${greeting}

An administrator has provisioned your system account on PeoplePay360 with the role of ${role}.

Your temporary sign-in credentials:
- Email: ${toEmail}
- Temporary Password: ${temporaryPassword}

Please verify your email address to activate your account:
${verificationUrl}

Security Notice: After signing in, you can change your password in your settings.
  `.trim();

  const transporter = await getTransporter();

  if (!transporter) {
    console.warn(
      '[MAILER] SMTP credentials not fully configured in .env. Logging email to console:',
    );
    console.log(
      `[MAILER DUMP] To: ${toEmail} | Password: ${temporaryPassword} | Verification URL: ${verificationUrl}`,
    );
    return { success: false, error: 'SMTP credentials missing; logged to console' };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Welcome to PeoplePay360 — Verify Your Email & Account Credentials',
      text,
      html,
    });

    console.log(
      `[MAILER] Welcome credentials email dispatched to ${toEmail} (Message ID: ${info.messageId})`,
    );
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[MAILER] Failed to send credentials email to ${toEmail}:`,
      errorMsg,
    );
    return { success: false, error: errorMsg };
  }
};

export type VerificationEmailOptions = {
  toEmail: string;
  employeeName?: string | null;
  verificationToken: string;
};

export const sendVerificationEmail = async (
  options: VerificationEmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const { toEmail, employeeName, verificationToken } = options;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;
  const from = process.env.SMTP_FROM || 'PeoplePay360 <noreply@peoplepay360.com>';
  const greeting = employeeName ? `Hello ${employeeName},` : 'Hello,';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email — PeoplePay360</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f5f7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="padding: 32px 36px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <span style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">
                PeoplePay<span style="color: #6A3FA0;">360</span>
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #0f172a;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Please verify your email address to activate your PeoplePay360 account and begin using the platform.
              </p>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${verificationUrl}"
                   target="_blank"
                   style="display: inline-block; background-color: #6A3FA0; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; letter-spacing: 0.2px;">
                  Verify Email Address &rarr;
                </a>
              </div>
              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Or copy and paste this verification URL into your browser:<br />
                <a href="${verificationUrl}" style="color: #6A3FA0; word-break: break-all; font-size: 12px;">${verificationUrl}</a>
              </p>
              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                This link will expire in 8 hours. If you did not request this email, please ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Verify your email address — PeoplePay360

${greeting}

Please verify your email address to activate your PeoplePay360 account and sign in:
${verificationUrl}

This link is valid for 8 hours.
  `.trim();

  const transporter = await getTransporter();

  if (!transporter) {
    console.warn(
      '[MAILER] SMTP credentials not fully configured in .env. Logging email to console:',
    );
    console.log(
      `[MAILER DUMP] Verification Email To: ${toEmail} | Verification URL: ${verificationUrl}`,
    );
    return { success: false, error: 'SMTP credentials missing; logged to console' };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Verify Your Email Address — PeoplePay360',
      text,
      html,
    });

    console.log(
      `[MAILER] Verification email dispatched to ${toEmail} (Message ID: ${info.messageId})`,
    );
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(
      `[MAILER] Failed to send verification email to ${toEmail}:`,
      errorMsg,
    );
    return { success: false, error: errorMsg };
  }
};

export type PayslipEmailOptions = {
  toEmail: string;
  employeeName: string;
  period: string;
  netSalary: number;
  grossSalary: number;
  totalDeductions: number;
  payrunName: string;
};

export const sendPayslipEmail = async (
  options: PayslipEmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const { toEmail, employeeName, period, netSalary, grossSalary, totalDeductions, payrunName } = options;
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const from = process.env.SMTP_FROM || 'PeoplePay360 <noreply@peoplepay360.com>';

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Payslip — ${period}</title>
</head>
<body style="margin:0;padding:0;font-family:'IBM Plex Sans',Arial,sans-serif;background:#f9f9f7;color:#1a1a1a;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #e5e5e0;border-radius:12px;overflow:hidden;">
    <div style="padding:24px 28px;border-bottom:1px solid #e5e5e0;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;color:#6A3FA0;text-transform:uppercase;">PeoplePay360</div>
      <h1 style="margin:8px 0 4px;font-size:22px;font-weight:700;color:#1a1a1a;">Your Payslip is Ready</h1>
      <p style="margin:0;font-size:13px;color:#6b6b6b;">${payrunName} · ${period}</p>
    </div>
    <div style="padding:28px;">
      <p style="font-size:14px;color:#1a1a1a;margin:0 0 20px;">Hello ${employeeName},</p>
      <p style="font-size:13px;color:#6b6b6b;margin:0 0 24px;">Your payslip for the period <strong style="color:#1a1a1a;">${period}</strong> has been processed and is available in PeoplePay360.</p>

      <div style="background:#f9f9f7;border:1px solid #e5e5e0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:12px;color:#6b6b6b;">Gross Salary</span>
          <span style="font-size:13px;font-weight:600;color:#1a1a1a;">${formatCurrency(grossSalary)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <span style="font-size:12px;color:#6b6b6b;">Total Deductions</span>
          <span style="font-size:13px;font-weight:600;color:#c0392b;">-${formatCurrency(totalDeductions)}</span>
        </div>
        <div style="border-top:1px solid #e5e5e0;margin:12px 0;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:13px;font-weight:700;color:#1a1a1a;">Net Salary</span>
          <span style="font-size:16px;font-weight:700;color:#6A3FA0;">${formatCurrency(netSalary)}</span>
        </div>
      </div>

      <a href="${appUrl}/payslips" style="display:inline-block;background:#6A3FA0;color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;">View Full Payslip →</a>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e5e5e0;font-size:11px;color:#a0a09b;">
      This is an automated email from PeoplePay360 HR &amp; Payroll. Please do not reply directly to this message.
    </div>
  </div>
</body>
</html>`;

  const text = `Hello ${employeeName},\n\nYour payslip for ${period} is ready.\n\nGross Salary: ${formatCurrency(grossSalary)}\nDeductions: ${formatCurrency(totalDeductions)}\nNet Salary: ${formatCurrency(netSalary)}\n\nLog in at ${appUrl}/payslips to view your full payslip.`;

  const transporter = await getTransporter();

  if (!transporter) {
    console.log(
      `[MAILER] SMTP not configured. Payslip email to ${toEmail} (${employeeName}) — Net: ${formatCurrency(netSalary)} — skipped.`,
    );
    return { success: false, error: 'SMTP credentials missing; logged to console' };
  }

  try {
    const info = await transporter.sendMail({ from, to: toEmail, subject: `Your Payslip — ${period} | PeoplePay360`, text, html });
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[MAILER] Failed to send payslip email to ${toEmail}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
};
