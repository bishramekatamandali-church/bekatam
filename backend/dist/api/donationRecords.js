"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const enumNormalization_1 = require("../utils/enumNormalization");
const emailService_1 = require("../services/emailService");
const databaseFallback_1 = require("../utils/databaseFallback");
const contentUpdates_1 = require("../services/contentUpdates");
const router = express_1.default.Router();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'bishramekatamandali@gmail.com').toLowerCase().trim();
// GET all donation records
router.get('/', async (req, res) => {
    try {
        const records = await db_1.prisma.donationrecord.findMany({
            orderBy: { donationDate: 'desc' },
        });
        res.json(records);
    }
    catch (error) {
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: 'Failed to fetch donation records.' });
    }
});
// POST a new donation record
router.post('/', async (req, res) => {
    const { donorName, donorEmail, amount, purpose, donationDate, paymentMethod, transactionReference, notes, isReceiptSent, postedByAdminId, postedByAdminName } = req.body;
    if (!donorName || !donorEmail || !amount || !purpose || !donationDate) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    const normalizedPurpose = (0, enumNormalization_1.normalizeEnumValue)(purpose, client_1.donationrecord_purpose);
    const normalizedPaymentMethod = (0, enumNormalization_1.normalizeEnumValue)(paymentMethod, client_1.donationrecord_paymentMethod);
    if (!normalizedPurpose) {
        return res.status(400).json({ error: 'Invalid donation purpose.' });
    }
    if (paymentMethod && !normalizedPaymentMethod) {
        return res.status(400).json({ error: 'Invalid donation payment method.' });
    }
    try {
        const newRecord = await db_1.prisma.donationrecord.create({
            data: {
                id: crypto_1.default.randomUUID(), // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                donorName,
                donorEmail,
                amount: Number(amount),
                purpose: normalizedPurpose,
                donationDate: new Date(donationDate),
                paymentMethod: normalizedPaymentMethod,
                transactionReference,
                notes,
                isReceiptSent: Boolean(isReceiptSent),
                postedByAdminId: postedByAdminId || 'system',
                postedByAdminName: postedByAdminName || 'System',
                transactionTimestamp: new Date(),
            }
        });
        let recordToReturn = newRecord;
        try {
            await (0, emailService_1.sendEmail)({
                to: donorEmail,
                subject: 'Thank you for your donation',
                text: `Dear ${donorName},\n\nThank you for your generous donation of ${Number(amount).toFixed(2)}.\nPurpose: ${normalizedPurpose}\nDate: ${new Date(donationDate).toLocaleDateString()}\n${transactionReference ? `Transaction Reference: ${transactionReference}\n` : ''}\nWe appreciate your support.\n\n— Bishram Ekata Mandali`,
                html: `
                    <p>Dear ${donorName},</p>
                    <p>Thank you for your generous donation of <strong>${Number(amount).toFixed(2)}</strong>.</p>
                    <p><strong>Purpose:</strong> ${normalizedPurpose}</p>
                    <p><strong>Date:</strong> ${new Date(donationDate).toLocaleDateString()}</p>
                    ${transactionReference ? `<p><strong>Transaction Reference:</strong> ${transactionReference}</p>` : ''}
                    <p>We appreciate your support.</p>
                    <p>— Bishram Ekata Mandali</p>
                `,
            });
            if (!isReceiptSent) {
                recordToReturn = await db_1.prisma.donationrecord.update({
                    where: { id: newRecord.id },
                    data: {
                        isReceiptSent: true,
                        updatedAt: new Date(),
                    },
                });
            }
        }
        catch (emailError) {
            console.error('Failed to send donation confirmation email:', emailError);
        }
        try {
            await (0, emailService_1.sendEmail)({
                to: ADMIN_EMAIL,
                subject: `New Donation Logged: ${donorName}`,
                text: `A new donation has been logged.\n\nDonor: ${donorName}\nEmail: ${donorEmail}\nAmount: NPR ${Number(amount).toFixed(2)}\nPurpose: ${normalizedPurpose}\nDate: ${new Date(donationDate).toLocaleDateString()}\n\nYou can review this in the admin dashboard.`,
                html: `
                    <p>A new donation has been logged.</p>
                    <ul>
                        <li><strong>Donor:</strong> ${donorName}</li>
                        <li><strong>Email:</strong> ${donorEmail}</li>
                        <li><strong>Amount:</strong> NPR ${Number(amount).toFixed(2)}</li>
                        <li><strong>Purpose:</strong> ${normalizedPurpose}</li>
                        <li><strong>Date:</strong> ${new Date(donationDate).toLocaleDateString()}</li>
                    </ul>
                    <p>You can review this in the admin dashboard.</p>
                `,
            });
        }
        catch (emailError) {
            console.error('Failed to send admin donation notification email:', emailError);
        }
        (0, contentUpdates_1.publishContentUpdate)({ type: 'donation', action: 'created', id: newRecord.id, timestamp: new Date().toISOString() });
        res.status(201).json(recordToReturn);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create donation record.' });
    }
});
// PUT (update) a donation record
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { donorName, donorEmail, amount, purpose, donationDate, paymentMethod, transactionReference, notes, isReceiptSent } = req.body;
    const normalizedPurpose = (0, enumNormalization_1.normalizeEnumValue)(purpose, client_1.donationrecord_purpose);
    const normalizedPaymentMethod = (0, enumNormalization_1.normalizeEnumValue)(paymentMethod, client_1.donationrecord_paymentMethod);
    if (!normalizedPurpose) {
        return res.status(400).json({ error: 'Invalid donation purpose.' });
    }
    if (paymentMethod && !normalizedPaymentMethod) {
        return res.status(400).json({ error: 'Invalid donation payment method.' });
    }
    try {
        const updatedRecord = await db_1.prisma.donationrecord.update({
            where: { id },
            data: {
                donorName,
                donorEmail,
                amount: Number(amount),
                purpose: normalizedPurpose,
                donationDate: new Date(donationDate),
                paymentMethod: normalizedPaymentMethod,
                transactionReference,
                notes,
                isReceiptSent: Boolean(isReceiptSent),
                updatedAt: new Date(),
            }
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'donation', action: 'updated', id: updatedRecord.id, timestamp: new Date().toISOString() });
        res.json(updatedRecord);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Donation record not found.' });
        }
        res.status(500).json({ error: 'Failed to update donation record.' });
    }
});
// DELETE a donation record
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.donationrecord.delete({ where: { id } });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'donation', action: 'deleted', id, timestamp: new Date().toISOString() });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Donation record not found.' });
        }
        res.status(500).json({ error: 'Failed to delete donation record.' });
    }
});
exports.default = router;
