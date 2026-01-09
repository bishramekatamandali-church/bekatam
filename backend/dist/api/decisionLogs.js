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
        const decisions = await db_1.prisma.decisionlog.findMany({ orderBy: { decisionDate: 'desc' } });
        res.json(decisions);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load decision logs.' });
    }
});
router.post('/', async (req, res) => {
    const { decisionDate, title, description, madeBy, status, followUpActions, postedByAdminId, postedByAdminName } = req.body;
    if (!decisionDate || !title || !description || !madeBy) {
        return res.status(400).json({ error: 'Decision date, title, description, and made by are required.' });
    }
    const normalizedStatus = (0, enumNormalization_1.normalizeEnumValue)(status, client_1.decisionlog_status);
    if (status && !normalizedStatus) {
        return res.status(400).json({ error: 'Invalid decision status.' });
    }
    try {
        const created = await db_1.prisma.decisionlog.create({
            data: {
                id: crypto_1.default.randomUUID(),
                decisionDate: new Date(decisionDate),
                title,
                description,
                madeBy,
                status: normalizedStatus,
                followUpActions,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create decision log.' });
    }
});
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { decisionDate, title, description, madeBy, status, followUpActions, postedByAdminId, postedByAdminName } = req.body;
    const normalizedStatus = (0, enumNormalization_1.normalizeEnumValue)(status, client_1.decisionlog_status);
    if (status && !normalizedStatus) {
        return res.status(400).json({ error: 'Invalid decision status.' });
    }
    try {
        const updated = await db_1.prisma.decisionlog.update({
            where: { id },
            data: {
                decisionDate: decisionDate ? new Date(decisionDate) : undefined,
                title,
                description,
                madeBy,
                status: normalizedStatus,
                followUpActions,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Decision log not found.' });
        }
        res.status(500).json({ error: 'Failed to update decision log.' });
    }
});
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.decisionlog.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Decision log not found.' });
        }
        res.status(500).json({ error: 'Failed to delete decision log.' });
    }
});
exports.default = router;
