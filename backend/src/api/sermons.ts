
import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, sermon } from '@prisma/client';

const router = express.Router();

// Helper to ensure the sermon object sent to the frontend has the expected shape
const shapeSermonForFrontend = (sermon: sermon): any => {
    return {
        ...sermon,
        comments: [], // Comments are handled separately on the frontend
    };
};


// GET all sermons
router.get('/', async (req, res) => {
    try {
        const sermons = await prisma.sermon.findMany({
            orderBy: {
                date: 'desc',
            },
        });
        res.json(sermons.map(shapeSermonForFrontend));
    } catch (error) {
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
    const { title, description, date, category, speaker, scripture, videoUrl, audioUrl, fullContent, imageUrl } = req.body;
    
    // TODO: Add validation and get user from auth token
    const postedByOwnerId = '0'; // Placeholder
    const postedByOwnerName = 'Admin System'; // Placeholder

    // Validate date before creating a Date object. Pass null if date is invalid or not provided.
    const sermonDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;
    const id = crypto.randomUUID();
    
    try {
        const newSermon = await prisma.sermon.create({
            data: {
                id, // REQUIRED in your schema
                updatedAt: new Date(),   // REQUIRED
                title,
                description,
                date: sermonDate, // Use the validated date or null
                category,
                speaker,
                scripture,
                videoUrl,
                audioUrl,
                fullContent,
                imageUrl,
                linkPath: `/sermons/${id}`,
                postedByOwnerId,
                postedByOwnerName,
            }
        });
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
    const { title, description, date, category, speaker, scripture, videoUrl, audioUrl, fullContent, imageUrl } = req.body;

    // Validate date before creating a Date object. Pass null if date is invalid or not provided.
    const sermonDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;

    try {
        const updatedSermon = await prisma.sermon.update({
            where: { id: id },
            data: {
                title,
                description,
                date: sermonDate, // Use the validated date or null
                category,
                speaker,
                scripture,
                videoUrl,
                audioUrl,
                fullContent,
                imageUrl,
                updatedAt: new Date(),
            }
        });
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
