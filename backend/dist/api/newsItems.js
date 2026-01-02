"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const shapeNewsItemForFrontend = (item) => ({
    ...item,
    comments: [], // Comments handled separately
    linkPath: `/news/${item.id}`,
    date: item.date ? new Date(item.date).toISOString() : null,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
    likes: item.likes || 0,
});
// GET all news items
router.get('/', async (req, res) => {
    try {
        const items = await db_1.prisma.newsitem.findMany({
            orderBy: { date: 'desc' },
        });
        res.json(items.map(shapeNewsItemForFrontend));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch news items" });
    }
});
// POST a new news item
router.post('/', async (req, res) => {
    const { title, description, date, category, imageUrl, videoUrl, audioUrl } = req.body;
    const itemDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
    const postedByOwnerId = '0';
    const postedByOwnerName = 'Admin System';
    const id = crypto_1.default.randomUUID();
    try {
        const newItem = await db_1.prisma.newsitem.create({
            data: {
                id, // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                title,
                description,
                date: itemDate,
                category,
                imageUrl,
                videoUrl,
                audioUrl,
                linkPath: `/news/${id}`,
                postedByOwnerId,
                postedByOwnerName,
            }
        });
        res.status(201).json(shapeNewsItemForFrontend(newItem));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create news item' });
    }
});
// PUT (update) a news item
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, imageUrl, videoUrl, audioUrl } = req.body;
    const itemDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : undefined;
    try {
        const updatedItem = await db_1.prisma.newsitem.update({
            where: { id },
            data: {
                title,
                description,
                date: itemDate,
                category,
                imageUrl,
                videoUrl,
                audioUrl,
                updatedAt: new Date(),
            }
        });
        res.json(shapeNewsItemForFrontend(updatedItem));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'News item not found.' });
        }
        res.status(500).json({ error: 'Failed to update news item' });
    }
});
// DELETE a news item
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.newsitem.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'News item not found.' });
        }
        res.status(500).json({ error: 'Failed to delete news item' });
    }
});
exports.default = router;
