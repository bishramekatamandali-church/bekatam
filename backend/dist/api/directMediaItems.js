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
// Fetch all direct media uploads
router.get('/', async (_req, res) => {
    try {
        const items = await db_1.prisma.directmediaitem.findMany({
            orderBy: { uploadDate: 'desc' },
        });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load media library.' });
    }
});
// Create a new direct media item (images, audio, video, pdf, etc.)
router.post('/', async (req, res) => {
    const { title, description, url, mediaType, category, tags, postedByAdminId, postedByAdminName } = req.body;
    if (!title || !url || !mediaType) {
        return res.status(400).json({ error: 'Title, URL, and media type are required.' });
    }
    try {
        const created = await db_1.prisma.directmediaitem.create({
            data: {
                id: crypto_1.default.randomUUID(),
                title,
                description,
                url,
                mediaType,
                category,
                tags,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to save media item.' });
    }
});
// Update an existing media item
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, url, mediaType, category, tags, postedByAdminId, postedByAdminName } = req.body;
    try {
        const updated = await db_1.prisma.directmediaitem.update({
            where: { id },
            data: {
                title,
                description,
                url,
                mediaType,
                category,
                tags,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Media item not found.' });
        }
        res.status(500).json({ error: 'Failed to update media item.' });
    }
});
// Delete a media item
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.directmediaitem.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Media item not found.' });
        }
        res.status(500).json({ error: 'Failed to delete media item.' });
    }
});
exports.default = router;
