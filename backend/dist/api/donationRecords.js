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
const databaseFallback_1 = require("../utils/databaseFallback");
const router = express_1.default.Router();
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
        res.status(201).json(newRecord);
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
