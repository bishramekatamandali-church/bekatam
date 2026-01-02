
import express from 'express';
import { prisma } from '../db';
import { Prisma, ministry } from '@prisma/client';

const router = express.Router();

const shapeMinistryForFrontend = (ministry: ministry): any => ({
    ...ministry,
    linkPath: `/ministries/${ministry.id}`,
    // Frontend expects certain fields that might be null in DB
    leader: ministry.leader || '',
    meetingTime: ministry.meetingTime || '',
});

// GET all ministries
router.get('/', async (req, res) => {
    try {
        const ministries = await prisma.ministry.findMany({
            orderBy: {
                title: 'asc',
            },
        });
        res.json(ministries.map(shapeMinistryForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch ministries" });
    }
});

// GET a single ministry by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const ministry = await prisma.ministry.findUnique({
            where: { id },
        });
        if (ministry) {
            res.json(shapeMinistryForFrontend(ministry));
        } else {
            res.status(404).json({ error: "Ministry not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch ministry" });
    }
});

// POST a new ministry
router.post('/', async (req, res) => {
    const { title, description, category, leader, meetingTime, imageUrl } = req.body;
    const postedByOwnerId = '0'; 
    const postedByOwnerName = 'Admin System';

    try {
        const newMinistry = await prisma.ministry.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                title,
                description,
                category,
                leader,
                meetingTime,
                imageUrl,
                linkPath: '', // Will be generated on frontend or dynamically
                postedByOwnerId,
                postedByOwnerName,
            }
        });
        res.status(201).json(shapeMinistryForFrontend(newMinistry));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create ministry' });
    }
});

// PUT (update) a ministry
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, category, leader, meetingTime, imageUrl } = req.body;
    try {
        const updatedMinistry = await prisma.ministry.update({
            where: { id },
            data: {
                title,
                description,
                category,
                leader,
                meetingTime,
                imageUrl,
                updatedAt: new Date(),
            }
        });
        res.json(shapeMinistryForFrontend(updatedMinistry));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Ministry not found.' });
        }
        res.status(500).json({ error: 'Failed to update ministry' });
    }
});

// DELETE a ministry
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.ministry.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Ministry not found.' });
        }
        res.status(500).json({ error: 'Failed to delete ministry' });
    }
});

export default router;
