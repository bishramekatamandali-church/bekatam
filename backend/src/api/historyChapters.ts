
import express from 'express';
import { prisma } from '../db';
import { Prisma, historychapter } from '@prisma/client';

const router = express.Router();

const shapeChapterForFrontend = (chapter: historychapter): any => ({
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
        const chapters = await prisma.historychapter.findMany({
            orderBy: { chapterNumber: 'asc' },
        });
        res.json(chapters.map(shapeChapterForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history chapters" });
    }
});

// POST a new chapter
router.post('/', async (req, res) => {
    const { chapterNumber, title, content, status, imageUrl, summary } = req.body;
    const postedByOwnerId = '0';
    const postedByOwnerName = 'Admin System';
    const authorId = '0';
    const authorName = 'Admin System';

    try {
        const newChapter = await prisma.historychapter.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                chapterNumber: Number(chapterNumber) || 0,
                title,
                content,
                status,
                imageUrl,
                summary,
                authorId,
                authorName,
                lastPublishedAt: status === 'published' ? new Date() : undefined,
                postedByOwnerId,
                postedByOwnerName,
            }
        });
        res.status(201).json(shapeChapterForFrontend(newChapter));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create history chapter' });
    }
});

// PUT (update) a chapter
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { chapterNumber, title, content, status, imageUrl, summary } = req.body;
    
    try {
        const existingChapter = await prisma.historychapter.findUnique({ where: { id } });
        if (!existingChapter) {
            return res.status(404).json({ error: 'History chapter not found.' });
        }

        const updatedChapter = await prisma.historychapter.update({
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
    } catch (error) {
        res.status(500).json({ error: 'Failed to update history chapter' });
    }
});

// DELETE a chapter
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.historychapter.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'History chapter not found.' });
        }
        res.status(500).json({ error: 'Failed to delete history chapter' });
    }
});

export default router;
