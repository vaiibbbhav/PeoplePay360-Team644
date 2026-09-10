export type EmailLayoutProps = {
  title: string;
  heading: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
};

export const renderEmailLayout = ({
  title,
  heading,
  bodyHtml,
  ctaText,
  ctaUrl,
  footerNote,
}: EmailLayoutProps): string => {
  const currentYear = new Date().getFullYear();

  const ctaBlock =
    ctaText && ctaUrl
      ? `
        <div style="margin: 28px 0; text-align: center;">
          <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #6A3FA0; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; letter-spacing: 0.02em;">
            ${ctaText} &rarr;
          </a>
        </div>
        <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748b; word-break: break-all;">
          Or open this link directly: <a href="${ctaUrl}" style="color: #6A3FA0; text-decoration: underline;">${ctaUrl}</a>
        </p>
      `
      : '';

  const footerNoteBlock = footerNote
    ? `
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
        ${footerNote}
      </p>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <div style="font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #6A3FA0;">
                PeoplePay<span style="color: #0f172a;">360</span>
              </div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-top: 4px;">
                Enterprise HR &amp; Payroll Management
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #0f172a; line-height: 1.3;">
                ${heading}
              </h1>
              ${bodyHtml}
              ${ctaBlock}
              ${footerNoteBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <div style="font-size: 11px; color: #94a3b8;">
                &copy; ${currentYear} PeoplePay360. All rights reserved.
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
};

export const getWelcomeEmailHtml = (options: {
  employeeName?: string | null;
  toEmail: string;
  temporaryPassword: string;
  role: string;
  verificationUrl: string;
}): string => {
  const greeting = options.employeeName ? `Hello ${options.employeeName},` : 'Hello,';
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      ${greeting}
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      An administrator has provisioned your system account on <strong>PeoplePay360</strong> with the role of <strong>${options.role}</strong>. Below are your temporary sign-in credentials:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; margin-bottom: 2px;">Login Email</div>
        <div style="font-size: 14px; font-weight: 600; color: #0f172a; font-family: monospace;">${options.toEmail}</div>
      </div>
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600; margin-bottom: 2px;">Temporary Password</div>
        <div style="display: inline-block; background-color: #ffffff; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 4px 10px; font-size: 14px; font-weight: 700; color: #6A3FA0; font-family: monospace;">
          ${options.temporaryPassword}
        </div>
      </div>
    </div>
  `;

  return renderEmailLayout({
    title: 'Welcome to PeoplePay360',
    heading: 'Your Account Has Been Created',
    bodyHtml,
    ctaText: 'Verify Email & Sign In',
    ctaUrl: options.verificationUrl,
    footerNote: '<strong>Security Reminder:</strong> For your security, please log in and change your password upon your first sign-in.',
  });
};

export const getVerificationEmailHtml = (options: {
  employeeName?: string | null;
  verificationUrl: string;
}): string => {
  const greeting = options.employeeName ? `Hello ${options.employeeName},` : 'Hello,';
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      ${greeting}
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Please verify your email address to activate your PeoplePay360 account and begin using the platform.
    </p>
  `;

  return renderEmailLayout({
    title: 'Verify Your Email Address — PeoplePay360',
    heading: 'Verify Your Email Address',
    bodyHtml,
    ctaText: 'Verify Email Address',
    ctaUrl: options.verificationUrl,
    footerNote: 'This verification link will expire in 8 hours. If you did not request this email, please disregard it.',
  });
};

export const getPasswordResetEmailHtml = (options: {
  employeeName?: string | null;
  resetUrl: string;
}): string => {
  const greeting = options.employeeName ? `Hello ${options.employeeName},` : 'Hello,';
  const bodyHtml = `
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      ${greeting}
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      We received a request to reset the password for your <strong>PeoplePay360</strong> account. Click the button below to choose a new password:
    </p>
  `;

  return renderEmailLayout({
    title: 'Reset Your Password — PeoplePay360',
    heading: 'Password Reset Request',
    bodyHtml,
    ctaText: 'Reset Password',
    ctaUrl: options.resetUrl,
    footerNote: 'This password reset link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email; your account remains secure.',
  });
};

export const getPayslipEmailHtml = (options: {
  employeeName: string;
  period: string;
  netSalary: number;
  grossSalary: number;
  totalDeductions: number;
  payrunName: string;
  payslipUrl: string;
}): string => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const bodyHtml = `
    <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Hello ${options.employeeName},
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
      Your payslip for <strong>${options.period}</strong> (${options.payrunName}) has been processed and is ready for review:
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Gross Salary</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${formatCurrency(options.grossSalary)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Total Deductions</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #a4483b;">-${formatCurrency(options.totalDeductions)}</td>
        </tr>
        <tr>
          <td colspan="2" style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;"></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">Net Payout</td>
          <td align="right" style="padding: 6px 0; font-size: 16px; font-weight: 700; color: #6A3FA0;">${formatCurrency(options.netSalary)}</td>
        </tr>
      </table>
    </div>
  `;

  return renderEmailLayout({
    title: `Your Payslip — ${options.period}`,
    heading: 'Your Payslip is Ready',
    bodyHtml,
    ctaText: 'View Full Payslip',
    ctaUrl: options.payslipUrl,
    footerNote: 'This is an automated notification from PeoplePay360 HR &amp; Payroll. For inquiries regarding your salary statement, please contact your payroll manager.',
  });
};
