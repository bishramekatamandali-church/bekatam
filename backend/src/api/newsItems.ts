

























import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, newsitem, newsitem_category } from '@prisma/client';
import { publishContentUpdate } from '../services/contentUpdates';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

const shapeNewsItemForFrontend = (n: any): any => {
    const { comment, ...item } = n;
    const comments = Array.isArray(comment) ? comment.map((c: any) => ({
        id: c.id,
        itemId: item.id,
        itemType: 'news',
        userId: c.userId ?? null,
        userName: c.userName,
        userProfileImageUrl: c.userProfileImageUrl ?? null,
        isGuest: c.isGuest ?? false,
        guestEmail: c.guestEmail ?? null,
        guestPhone: c.guestPhone ?? null,
        text: c.text,
        timestamp: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString(),
        editedAt: c.editedAt ? new Date(c.editedAt).toISOString() : null,
    })) : [];
    comments.sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    return {
        ...item,
        comments,
        linkPath: `/news/${item.id}`,
        date: item.date ? new Date(item.date).toISOString() : null,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
        likes: item.likes || 0,
    };
};

// GET all news items
router.get('/', async (req, res) => {
    try {
        const items = await prisma.newsitem.findMany({
            include: { comment: true },
            orderBy: { date: 'desc' },
        });
        res.json(items.map(shapeNewsItemForFrontend));
    } catch (error) {
        if (handleDatabaseFallback(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Failed to fetch news items" });
    }
});

// POST a new news item
router.post('/', async (req, res) => {
    const { title, description, date, category, imageUrl, videoUrl, audioUrl, postedByAdminId, postedByAdminName } = req.body;
    const itemDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const id = crypto.randomUUID();
    const normalizedCategory = normalizeEnumValue(category, newsitem_category);

    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid news category.' });
    }

    try {
        const newItem = await prisma.newsitem.create({
            data: {
                id, // REQUIRED in your schema
                updatedAt: new Date(),   // REQUIRED
                title,
                description,
                date: itemDate,
                category: normalizedCategory,
                imageUrl,
                videoUrl,
                audioUrl,
                linkPath: `/news/${id}`,
                postedByAdminId,
                postedByAdminName,
            }
        });
    publishContentUpdate({ type: 'news', action: 'created', id: newItem.id, timestamp: new Date().toISOString() });
        res.status(201).json(shapeNewsItemForFrontend(newItem));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error creating news item.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to create news item' });
    }
});

// PUT (update) a news item
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, imageUrl, videoUrl, audioUrl, postedByAdminId, postedByAdminName } = req.body;
    const itemDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const normalizedCategory = normalizeEnumValue(category, newsitem_category);

    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid news category.' });
    }
    
    try {
        const updatedItem = await prisma.newsitem.update({
            where: { id },
            data: {
                title,
                description,
                date: itemDate,
                category: normalizedCategory,
                imageUrl,
                videoUrl,
                audioUrl,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            }
        });
    publishContentUpdate({ type: 'news', action: 'updated', id: updatedItem.id, timestamp: new Date().toISOString() });
        res.json(shapeNewsItemForFrontend(updatedItem));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'News item not found.' });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error updating news item.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to update news item' });
    }
});

// DELETE a news item
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.newsitem.delete({ where: { id } });
        publishContentUpdate({ type: 'news', action: 'deleted', id, timestamp: new Date().toISOString() });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'News item not found.' });
        }
        res.status(500).json({ error: 'Failed to delete news item' });
    }
});

export default router; 
