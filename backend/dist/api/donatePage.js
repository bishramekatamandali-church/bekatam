"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const contentUpdates_1 = require("../services/contentUpdates");
const router = express_1.default.Router();
const SINGLETON_ID = 'singleton';
// Get donate page content
router.get('/', async (_req, res) => {
    try {
        const content = await db_1.prisma.donatepagecontent.findUnique({ where: { id: SINGLETON_ID } });
        res.json(content);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load donate page content.' });
    }
});
// Upsert donate page content
router.put('/', async (req, res) => {
    const data = req.body;
    try {
        const updated = await db_1.prisma.donatepagecontent.upsert({
            where: { id: SINGLETON_ID },
            create: {
                id: SINGLETON_ID,
                ...data,
                updatedAt: new Date(),
            },
            update: {
                ...data,
                updatedAt: new Date(),
            },
        });
        (0, contentUpdates_1.publishContentUpdate)({ type: 'donatePageContent', action: 'updated', id: SINGLETON_ID, timestamp: new Date().toISOString() });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save donate page content.' });
    }
});
exports.default = router;
