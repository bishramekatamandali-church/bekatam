"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
let transporter;
// Use an async function to initialize the transporter with a test account
async function initializeEmailService() {
    try {
        // Create a test account with Ethereal
        const testAccount = await nodemailer_1.default.createTestAccount();
        console.log("📧 Nodemailer test account created for email previews.");
        console.log("   User: %s", testAccount.user);
        console.log("   Pass: %s", testAccount.pass);
        transporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
        console.log("📧 Email service initialized and ready to send emails via Ethereal.");
    }
    catch (error) {
        console.error("❌ Failed to create Nodemailer test account. Email sending will not work.", error);
    }
}
// Initialize the service when the module is loaded
initializeEmailService();
const sendEmail = async (options) => {
    if (!transporter) {
        console.error("❌ Email transporter is not initialized. Cannot send email.");
        throw new Error("Email service is not available.");
    }
    const mailOptions = {
        from: '"BEM Church App" <no-reply@bemchurch.com>', // sender address
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
        if (previewUrl) {
            console.log("📬 Preview URL for the sent email: %s", previewUrl);
        }
    }
    catch (error) {
        console.error("❌ Error sending email:", error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
