






import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, sermon, sermon_category } from '@prisma/client';
import { publishContentUpdate } from '../services/contentUpdates';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

const isMissingLocationColumnError = (error: unknown): boolean => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
        const message = typeof error.message === 'string' ? error.message : '';
        return message.includes('location');
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
        return error.message.includes('location');
    }
    return false;
};

const buildSermonSelect = (includeLocation: boolean) => ({
    id: true,
    title: true,
    description: true,
    imageUrl: true,
    linkPath: true,
    category: true,
    date: true,
    postedByAdminId: true,
    postedByAdminName: true,
    createdAt: true,
    updatedAt: true,
    speaker: true,
    scripture: true,
    videoUrl: true,
    audioUrl: true,
    fullContent: true,
    likes: true,
    ...(includeLocation ? { location: true } : {}),
    comment: true,
});

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
            select: buildSermonSelect(true),
            orderBy: { date: 'desc' },
        });
        res.json(sermons.map(shapeSermonForFrontend));
    } catch (error) {
        if (isMissingLocationColumnError(error)) {
            try {
                const sermons = await prisma.sermon.findMany({
                    select: buildSermonSelect(false),
                    orderBy: { date: 'desc' },
                });
                res.json(sermons.map(shapeSermonForFrontend));
                return;
            } catch (fallbackError) {
                if (handleDatabaseFallback(req, res, fallbackError)) {
                    return;
                }
                console.error("Error fetching sermons without location:", fallbackError);
                res.status(500).json({ error: "Failed to fetch sermons" });
                return;
            }
        }
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
            select: buildSermonSelect(true),
        });
        if (sermon) {
            res.json(shapeSermonForFrontend(sermon));
        } else {
            res.status(404).json({ error: "Sermon not found" });
        }
    } catch (error) {
        if (isMissingLocationColumnError(error)) {
            try {
                const sermon = await prisma.sermon.findUnique({
                    where: { id: id },
                    select: buildSermonSelect(false),
                });
                if (sermon) {
                    res.json(shapeSermonForFrontend(sermon));
                } else {
                    res.status(404).json({ error: "Sermon not found" });
                }
                return;
            } catch (fallbackError) {
                console.error(`Error fetching sermon with id "${id}" without location:`, fallbackError);
                res.status(500).json({ error: "Failed to fetch sermon" });
                return;
            }
        }
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
        if (isMissingLocationColumnError(error)) {
            try {
                const newSermon = await prisma.sermon.create({
                    data: {
                        id,
                        updatedAt: new Date(),
                        title,
                        description,
                        date: sermonDate,
                        category: normalizedCategory,
                        speaker,
                        scripture,
                        videoUrl,
                        audioUrl,
                        fullContent,
                        imageUrl,
                        postedByAdminId,
                        postedByAdminName,
                        linkPath: `/sermons/${id}`,
                    }
                });
                publishContentUpdate({ type: 'sermon', action: 'created', id: newSermon.id, timestamp: new Date().toISOString() });
                res.status(201).json(shapeSermonForFrontend(newSermon));
                return;
            } catch (fallbackError) {
                console.error("Error creating sermon without location:", fallbackError);
                if (fallbackError instanceof Prisma.PrismaClientKnownRequestError) {
                    return res.status(400).json({ error: 'Database error creating sermon.', details: fallbackError.message });
                }
                res.status(500).json({ error: 'Failed to create sermon' });
                return;
            }
        }
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
        if (isMissingLocationColumnError(error)) {
            try {
                const updatedSermon = await prisma.sermon.update({
                    where: { id: id },
                    data: {
                        title,
                        description,
                        date: sermonDate,
                        category: normalizedCategory,
                        speaker,
                        scripture,
                        videoUrl,
                        audioUrl,
                        fullContent,
                        imageUrl,
                        postedByAdminId,
                        postedByAdminName,
                        updatedAt: new Date(),
                    }
                });
                publishContentUpdate({ type: 'sermon', action: 'updated', id: updatedSermon.id, timestamp: new Date().toISOString() });
                res.json(shapeSermonForFrontend(updatedSermon));
                return;
            } catch (fallbackError) {
                console.error(`Error updating sermon with id "${id}" without location:`, fallbackError);
                if (fallbackError instanceof Prisma.PrismaClientKnownRequestError) {
                    if (fallbackError.code === 'P2025') {
                        return res.status(404).json({ error: 'Sermon to update not found.' });
                    }
                    return res.status(400).json({ error: 'Database error updating sermon.', details: fallbackError.message });
                }
                res.status(500).json({ error: 'Failed to update sermon' });
                return;
            }
        }
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
