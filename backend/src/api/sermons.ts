






import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, sermon, sermon_category } from '@prisma/client';
import { publishContentUpdate } from '../services/contentUpdates';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

// Helper to ensure the sermon object sent to the frontend has the expected shape
const shapeSermonForFrontend = (s: any): any => {
    const { comment, ...sermon } = s;
    const comments = Array.isArray(comment) ? comment.map((c: any) => ({
        id: c.id,
        itemId: sermon.id,
        itemType: 'sermon',
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
    return { ...sermon, comments };
};

// GET all sermons
router.get('/', async (req, res) => {
    try {
        const sermons = await prisma.sermon.findMany({
            include: { comment: true },
            orderBy: { date: 'desc' },
        });
        res.json(sermons.map(shapeSermonForFrontend));
    } catch (error) {
        if (handleDatabaseFallback(req, res, error)) {
            return;
        }
        console.error("Error fetching sermons:", error);
        res.status(500).json({ error: "Failed to fetch sermons" });
    }
});

// GET a single sermon by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sermon = await prisma.sermon.findUnique({
            where: { id: id },
            include: { comment: true },
        });
        if (sermon) {
            res.json(shapeSermonForFrontend(sermon));
        } else {
            res.status(404).json({ error: "Sermon not found" });
        }
    } catch (error) {
        console.error(`Error fetching sermon with id "${id}":`, error);
        res.status(500).json({ error: "Failed to fetch sermon" });
    }
});

// POST a new sermon
router.post('/', async (req, res) => {
    const { title, description, date, category, speaker, scripture, videoUrl, audioUrl, fullContent, imageUrl, location, postedByAdminId, postedByAdminName } = req.body;
    
    // Validate date before creating a Date object. Pass null if date is invalid or not provided.
    const sermonDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const id = crypto.randomUUID();
    const normalizedCategory = normalizeEnumValue(category, sermon_category);

    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid sermon category.' });
    }

    try {
        const newSermon = await prisma.sermon.create({
            data: {
                id, // REQUIRED in your schema
                updatedAt: new Date(),   // REQUIRED
                title,
                description,
                date: sermonDate, // Use the validated date or null
                category: normalizedCategory,
                speaker,
                scripture,
                videoUrl,
                audioUrl,
                fullContent,
                imageUrl,
                location,
                postedByAdminId,
                postedByAdminName,
                linkPath: `/sermons/${id}`,
                }
        });
    publishContentUpdate({ type: 'sermon', action: 'created', id: newSermon.id, timestamp: new Date().toISOString() });
        res.status(201).json(shapeSermonForFrontend(newSermon));
    } catch (error) {
        console.error("Error creating sermon:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error creating sermon.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to create sermon' });
    }
});

// PUT (update) a sermon
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, speaker, scripture, videoUrl, audioUrl, fullContent, imageUrl, location, postedByAdminId, postedByAdminName } = req.body;

    // Validate date before creating a Date object. Pass null if date is invalid or not provided.
    const sermonDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const normalizedCategory = normalizeEnumValue(category, sermon_category);

    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid sermon category.' });
    }

    try {
        const updatedSermon = await prisma.sermon.update({
            where: { id: id },
            data: {
                title,
                description,
                date: sermonDate, // Use the validated date or null
                category: normalizedCategory,
                speaker,
                scripture,
                videoUrl,
                audioUrl,
                fullContent,
                imageUrl,
                location,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            }
        });
    publishContentUpdate({ type: 'sermon', action: 'updated', id: updatedSermon.id, timestamp: new Date().toISOString() });
        res.json(shapeSermonForFrontend(updatedSermon));
    } catch (error) {
        console.error(`Error updating sermon with id "${id}":`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                 return res.status(404).json({ error: 'Sermon to update not found.' });
            }
            return res.status(400).json({ error: 'Database error updating sermon.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to update sermon' });
    }
});

// DELETE a sermon
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.sermon.delete({
            where: { id: id },
        });
    publishContentUpdate({ type: 'sermon', action: 'deleted', id, timestamp: new Date().toISOString() });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error(`Error deleting sermon with id "${id}":`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                 return res.status(404).json({ error: 'Sermon to delete not found.' });
            }
        }
        res.status(500).json({ error: 'Failed to delete sermon' });
    }
});


export default router; 
