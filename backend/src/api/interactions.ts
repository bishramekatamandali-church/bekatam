
import express from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';

const router = express.Router();

// POST /api/interactions/toggle-like/:itemType/:itemId
router.post('/toggle-like/:itemType/:itemId', async (req, res) => {
    const { itemType, itemId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    if (!['like', 'unlike'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action specified.' });
    }

    const prismaModelMap: { [key: string]: any } = {
        sermon: prisma.sermon,
        event: prisma.eventitem,
        blogPost: prisma.blogpost,
        news: prisma.newsitem,
        historyChapter: prisma.historychapter,
    };

    const model = prismaModelMap[itemType];
    if (!model) {
        return res.status(400).json({ error: 'Invalid item type specified.' });
    }

    try {
        const updatedItem = await model.update({
            where: { id: itemId },
            data: {
                likes: {
                    [action === 'like' ? 'increment' : 'decrement']: 1,
                },
            },
        });

        // Ensure likes don't go below zero
        if (updatedItem.likes < 0) {
            await model.update({
                where: { id: itemId },
                data: { likes: 0 }
            });
            updatedItem.likes = 0;
        }

        res.json(updatedItem);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: `Item of type ${itemType} with ID ${itemId} not found.` });
        }
        console.error(`Error toggling like for ${itemType} ${itemId}:`, error);
        res.status(500).json({ error: 'Failed to update like count.' });
    }
});

export default router;
