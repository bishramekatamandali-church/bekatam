"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const db_1 = require("../db");
const crypto_1 = __importDefault(require("crypto"));
const enumNormalization_1 = require("../utils/enumNormalization");
const router = express_1.default.Router();
router.get('/', async (_req, res) => {
    try {
        const expenses = await db_1.prisma.expenserecord.findMany({ orderBy: { expenseDate: 'desc' } });
        res.json(expenses);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch expense records.' });
    }
});
router.post('/', async (req, res) => {
    const { expenseDate, category, description, amount, payee, paymentMethod, transactionReference, receiptUrl, approvedBy, notes, source, location, status, postedByAdminId, postedByAdminName } = req.body;
    if (!expenseDate || !category || !description || amount === undefined) {
        return res.status(400).json({ error: 'Expense date, category, description, and amount are required.' });
    }
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.expenserecord_category);
    const normalizedPaymentMethod = (0, enumNormalization_1.normalizeEnumValue)(paymentMethod, client_1.expenserecord_paymentMethod);
    const normalizedStatus = (0, enumNormalization_1.normalizeEnumValue)(status, client_1.expenserecord_status);
    if (!normalizedCategory) {
        return res.status(400).json({ error: 'Invalid expense category.' });
    }
    if (paymentMethod && !normalizedPaymentMethod) {
        return res.status(400).json({ error: 'Invalid expense payment method.' });
    }
    if (status && !normalizedStatus) {
        return res.status(400).json({ error: 'Invalid expense status.' });
    }
    try {
        const created = await db_1.prisma.expenserecord.create({
            data: {
                id: crypto_1.default.randomUUID(),
                expenseDate: new Date(expenseDate),
                category: normalizedCategory,
                description,
                amount: Number(amount),
                payee,
                paymentMethod: normalizedPaymentMethod,
                transactionReference,
                receiptUrl,
                approvedBy,
                notes,
                source,
                location,
                status: normalizedStatus,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create expense record.' });
    }
});
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { expenseDate, category, description, amount, payee, paymentMethod, transactionReference, receiptUrl, approvedBy, notes, source, location, status, postedByAdminId, postedByAdminName } = req.body;
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.expenserecord_category);
    const normalizedPaymentMethod = (0, enumNormalization_1.normalizeEnumValue)(paymentMethod, client_1.expenserecord_paymentMethod);
    const normalizedStatus = (0, enumNormalization_1.normalizeEnumValue)(status, client_1.expenserecord_status);
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid expense category.' });
    }
    if (paymentMethod && !normalizedPaymentMethod) {
        return res.status(400).json({ error: 'Invalid expense payment method.' });
    }
    if (status && !normalizedStatus) {
        return res.status(400).json({ error: 'Invalid expense status.' });
    }
    try {
        const updated = await db_1.prisma.expenserecord.update({
            where: { id },
            data: {
                expenseDate: expenseDate ? new Date(expenseDate) : undefined,
                category: normalizedCategory,
                description,
                amount: amount !== undefined ? Number(amount) : undefined,
                payee,
                paymentMethod: normalizedPaymentMethod,
                transactionReference,
                receiptUrl,
                approvedBy,
                notes,
                source,
                location,
                status: normalizedStatus,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Expense record not found.' });
        }
        res.status(500).json({ error: 'Failed to update expense record.' });
    }
});
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.expenserecord.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Expense record not found.' });
        }
        res.status(500).json({ error: 'Failed to delete expense record.' });
    }
});
exports.default = router;
