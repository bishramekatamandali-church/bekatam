
import express from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';

const router = express.Router();

// POST a new comment
router.post('/', async (req, res) => {
    const { itemType, itemId, text, userId, userName, userProfileImageUrl } = req.body;

    if (!itemType || !itemId || !text || !userId || !userName) {
        return res.status(400).json({ error: 'Missing required fields for comment.' });
    }

    let data: any = {
        userId,
        userName,
        userProfileImageUrl,
        text,
        timestamp: new Date(),
    };

    switch (itemType) {
        case 'sermon': data.sermonId = itemId; break;
        case 'event': data.eventId = itemId; break;
        case 'blogPost': data.blogPostId = itemId; break;
        case 'news': data.newsItemId = itemId; break;
        case 'historyChapter': data.historyChapterId = itemId; break;
        case 'prayerRequest': data.prayerRequestId = itemId; break;
        default:
            return res.status(400).json({ error: 'Invalid itemType for comment.' });
    }

    try {
        const newComment = await prisma.comment.create({ data });
        res.status(201).json(newComment);
    } catch (error) {
        console.error("Error creating comment:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') { // Foreign key constraint failed
                return res.status(404).json({ error: `The ${itemType} with ID ${itemId} does not exist.` });
            }
        }
        res.status(500).json({ error: 'Failed to create comment.' });
    }
});

// PUT (update) a comment
router.put('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Comment text is required for update.' });
    }

    try {
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                text,
                editedAt: new Date(),
            }
        });
        res.json(updatedComment);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Comment to update not found.' });
        }
        res.status(500).json({ error: 'Failed to update comment.' });
    }
});

// DELETE a comment
router.delete('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    try {
        await prisma.comment.delete({
            where: { id: commentId },
        });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Comment to delete not found.' });
        }
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});

export default router;
