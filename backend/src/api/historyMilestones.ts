
import express from 'express';
import { prisma } from '../db';
import { Prisma, historymilestone } from '@prisma/client';

const router = express.Router();

const shapeMilestoneForFrontend = (milestone: historymilestone): any => ({
    ...milestone,
    createdAt: milestone.createdAt ? new Date(milestone.createdAt).toISOString() : null,
    updatedAt: milestone.updatedAt ? new Date(milestone.updatedAt).toISOString() : null,
});

// GET all milestones
router.get('/', async (req, res) => {
    try {
        const milestones = await prisma.historymilestone.findMany({
            orderBy: { year: 'asc' },
        });
        res.json(milestones.map(shapeMilestoneForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history milestones" });
    }
});

// POST a new milestone
router.post('/', async (req, res) => {
    const { year, title, description, imageUrl } = req.body;
    const postedByOwnerId = '0';
    const postedByOwnerName = 'Admin System';

    try {
        const newMilestone = await prisma.historymilestone.create({
            data: { id: crypto.randomUUID(), 
                updatedAt: new Date(), year, title, description, imageUrl, postedByOwnerId, postedByOwnerName }
        });
        res.status(201).json(shapeMilestoneForFrontend(newMilestone));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create history milestone' });
    }
});

// PUT (update) a milestone
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { year, title, description, imageUrl } = req.body;
    
    try {
        const updatedMilestone = await prisma.historymilestone.update({
            where: { id },
            data: { year, title, description, imageUrl, updatedAt: new Date() }
        });
        res.json(shapeMilestoneForFrontend(updatedMilestone));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'History milestone not found.' });
        }
        res.status(500).json({ error: 'Failed to update history milestone' });
    }
});

// DELETE a milestone
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.historymilestone.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'History milestone not found.' });
        }
        res.status(500).json({ error: 'Failed to delete history milestone' });
    }
});

export default router;
