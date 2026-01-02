
import express from 'express';
import { prisma } from '../db';
import { Prisma, homeslide } from '@prisma/client';

const router = express.Router();

const shapeHomeSlideForFrontend = (slide: homeslide): any => ({
    ...slide,
    createdAt: slide.createdAt ? new Date(slide.createdAt).toISOString() : null,
    updatedAt: slide.updatedAt ? new Date(slide.updatedAt).toISOString() : null,
});

// GET all home slides
router.get('/', async (req, res) => {
    try {
        const slides = await prisma.homeslide.findMany({
            orderBy: { order: 'asc' },
        });
        res.json(slides.map(shapeHomeSlideForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch home slides" });
    }
});

// POST a new home slide
router.post('/', async (req, res) => {
    const { title, description, imageUrl, ctaText, linkPath, order, isActive } = req.body;
    const postedByOwnerId = '0';
    const postedByOwnerName = 'Admin System';

    try {
        const newSlide = await prisma.homeslide.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                title,
                description,
                imageUrl,
                ctaText,
                linkPath,
                order: Number(order) || 0,
                isActive: Boolean(isActive),
                postedByOwnerId,
                postedByOwnerName,
            }
        });
        res.status(201).json(shapeHomeSlideForFrontend(newSlide));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create home slide' });
    }
});

// PUT (update) a home slide
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, imageUrl, ctaText, linkPath, order, isActive } = req.body;
    
    try {
        const updatedSlide = await prisma.homeslide.update({
            where: { id },
            data: {
                title,
                description,
                imageUrl,
                ctaText,
                linkPath,
                order: Number(order) || 0,
                isActive: Boolean(isActive),
                updatedAt: new Date(),
            }
        });
        res.json(shapeHomeSlideForFrontend(updatedSlide));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Home slide not found.' });
        }
        res.status(500).json({ error: 'Failed to update home slide' });
    }
});

// DELETE a home slide
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.homeslide.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Home slide not found.' });
        }
        res.status(500).json({ error: 'Failed to delete home slide' });
    }
});

export default router;
