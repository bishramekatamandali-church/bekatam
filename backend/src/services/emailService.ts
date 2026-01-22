import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

let transporter: nodemailer.Transporter;
let defaultFrom = '"BEM Church App" <no-reply@bemchurch.com>';

const parseBoolean = (value?: string) => {
  if (!value) return false;
  return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
};

const buildDefaultFrom = () => {
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@bemchurch.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'BEM Church App';
  defaultFrom = `"${fromName}" <${fromEmail}>`;
};

const createTransporter = async () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = parseBoolean(process.env.SMTP_SECURE);

  buildDefaultFrom();

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log('📧 Email service initialized with configured SMTP settings.');
    return;
  }
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.warn('⚠️ SMTP credentials missing. Falling back to Ethereal for email previews.');

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

     console.log('📧 Email service initialized with Ethereal test account.');
  } catch (error) {
    console.error('❌ Failed to initialize email service.', error);
  }
};

createTransporter();

export const sendEmail = async (options: MailOptions) => {
  if (!transporter) {
    console.error('❌ Email transporter is not initialized. Cannot send email.');
    throw new Error('Email service is not available.');
  }

  const mailOptions = {
    from: defaultFrom,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
     console.log('✅ Message sent: %s', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
     console.log('📬 Preview URL for the sent email: %s', previewUrl);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};
