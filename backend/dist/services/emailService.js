"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter;
let defaultFrom = '"BEM Church App" <no-reply@bemchurch.com>';
const parseBoolean = (value) => {
    if (!value)
        return false;
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
        transporter = nodemailer_1.default.createTransport({
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
        const testAccount = await nodemailer_1.default.createTestAccount();
        console.warn('⚠️ SMTP credentials missing. Falling back to Ethereal for email previews.');
        transporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('📧 Email service initialized with Ethereal test account.');
    }
    catch (error) {
        console.error('❌ Failed to initialize email service.', error);
    }
};
createTransporter();
const sendEmail = async (options) => {
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
        attachments: options.attachments,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Message sent: %s', info.messageId);
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('📬 Preview URL for the sent email: %s', previewUrl);
        }
    }
    catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
