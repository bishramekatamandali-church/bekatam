"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const databaseFallback_1 = require("../utils/databaseFallback");
const router = express_1.default.Router();
const shapeChapterForFrontend = (chapter) => ({
    ...chapter,
    comments: [], // Comments handled separately
    linkPath: `/church-history#${chapter.id}`,
    createdAt: chapter.createdAt ? new Date(chapter.createdAt).toISOString() : null,
    updatedAt: chapter.updatedAt ? new Date(chapter.updatedAt).toISOString() : null,
    lastPublishedAt: chapter.lastPublishedAt ? new Date(chapter.lastPublishedAt).toISOString() : null,
});
// GET all chapters
router.get('/', async (req, res) => {
    try {
        const chapters = await db_1.prisma.historychapter.findMany({
            orderBy: { chapterNumber: 'asc' },
        });
        res.json(chapters.map(shapeChapterForFrontend));
    }
    catch (error) {
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Failed to fetch history chapters" });
    }
});
// POST a new chapter
router.post('/', async (req, res) => {
    const { chapterNumber, title, content, status, imageUrl, summary } = req.body;
    const postedByAdminId = '0';
    const postedByAdminName = 'Admin System';
    const authorId = '0';
    const authorName = 'Admin System';
    try {
        const newChapter = await db_1.prisma.historychapter.create({
            data: {
                id: crypto_1.default.randomUUID(), // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                chapterNumber: Number(chapterNumber) || 0,
                title,
                content,
                status,
                imageUrl,
                summary,
                authorId,
                authorName,
                lastPublishedAt: status === 'published' ? new Date() : undefined,
                postedByAdminId,
                postedByAdminName,
            }
        });
        res.status(201).json(shapeChapterForFrontend(newChapter));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create history chapter' });
    }
});
// PUT (update) a chapter
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { chapterNumber, title, content, status, imageUrl, summary } = req.body;
    try {
        const existingChapter = await db_1.prisma.historychapter.findUnique({ where: { id } });
        if (!existingChapter) {
            return res.status(404).json({ error: 'History chapter not found.' });
        }
        const updatedChapter = await db_1.prisma.historychapter.update({
            where: { id },
            data: {
                chapterNumber: Number(chapterNumber) || 0,
                title,
                content,
                status,
                imageUrl,
                summary,
                lastPublishedAt: status === 'published' && existingChapter.status !== 'published' ? new Date() : existingChapter.lastPublishedAt,
                updatedAt: new Date(),
            }
        });
        res.json(shapeChapterForFrontend(updatedChapter));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update history chapter' });
    }
});
// DELETE a chapter
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.historychapter.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'History chapter not found.' });
        }
        res.status(500).json({ error: 'Failed to delete history chapter' });
    }
});
exports.default = router;
