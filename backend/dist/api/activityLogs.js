"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
router.get('/admin', async (_req, res) => {
    try {
        const logs = await db_1.prisma.adminactionlog.findMany({ orderBy: { timestamp: 'desc' } });
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load admin activity logs.' });
    }
});
router.post('/admin', async (req, res) => {
    const { adminId, adminName, action, targetId, details } = req.body;
    if (!adminId || !adminName || !action) {
        return res.status(400).json({ error: 'Admin id, name, and action are required.' });
    }
    try {
        const created = await db_1.prisma.adminactionlog.create({
            data: {
                id: crypto_1.default.randomUUID(),
                adminId,
                adminName,
                action,
                targetId,
                details,
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create admin action log.' });
    }
});
router.get('/frontend', async (_req, res) => {
    try {
        const logs = await db_1.prisma.frontendactivitylog.findMany({ orderBy: { timestamp: 'desc' } });
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load activity logs.' });
    }
});
router.post('/frontend', async (req, res) => {
    const { userId, description, type, itemId, itemType } = req.body;
    if (!description || !type) {
        return res.status(400).json({ error: 'Description and type are required.' });
    }
    try {
        const created = await db_1.prisma.frontendactivitylog.create({
            data: {
                id: crypto_1.default.randomUUID(),
                userId,
                description,
                type,
                itemId,
                itemType,
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create activity log.' });
    }
});
exports.default = router;
