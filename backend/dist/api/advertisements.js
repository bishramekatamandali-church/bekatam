"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const db_1 = require("../db");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
// List ads with newest first
router.get('/', async (_req, res) => {
    try {
        const ads = await db_1.prisma.advertisement.findMany({
            orderBy: { updatedAt: 'desc' },
        });
        res.json(ads);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load advertisements.' });
    }
});
// Create ad
router.post('/', async (req, res) => {
    const { name, adType, imageUrl, videoUrl, linkUrl, altText, placements, startDate, endDate, isActive, displayOrder, adSizeKey, postedByAdminId, postedByAdminName } = req.body;
    if (!name || !adType) {
        return res.status(400).json({ error: 'Name and ad type are required.' });
    }
    try {
        const created = await db_1.prisma.advertisement.create({
            data: {
                id: crypto_1.default.randomUUID(),
                name,
                adType,
                imageUrl,
                videoUrl,
                linkUrl,
                altText,
                placements: placements ?? [],
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isActive: Boolean(isActive),
                displayOrder: displayOrder ?? null,
                adSizeKey,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create advertisement.' });
    }
});
// Update ad
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, adType, imageUrl, videoUrl, linkUrl, altText, placements, startDate, endDate, isActive, displayOrder, adSizeKey, postedByAdminId, postedByAdminName } = req.body;
    try {
        const updated = await db_1.prisma.advertisement.update({
            where: { id },
            data: {
                name,
                adType,
                imageUrl,
                videoUrl,
                linkUrl,
                altText,
                placements: placements ?? [],
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isActive: Boolean(isActive),
                displayOrder,
                adSizeKey,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Advertisement not found.' });
        }
        res.status(500).json({ error: 'Failed to update advertisement.' });
    }
});
// Delete ad
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.advertisement.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Advertisement not found.' });
        }
        res.status(500).json({ error: 'Failed to delete advertisement.' });
    }
});
exports.default = router;
