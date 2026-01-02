
import express from 'express';
import { prisma } from '../db';
import { Prisma, branchchurch } from '@prisma/client';

const router = express.Router();

const shapeBranchForFrontend = (branch: branchchurch): any => ({
    ...branch,
    linkPath: `/branches#${branch.id}`,
    establishedDate: branch.establishedDate ? new Date(branch.establishedDate).toISOString().split('T')[0] : null,
    createdAt: branch.createdAt ? new Date(branch.createdAt).toISOString() : null,
    updatedAt: branch.updatedAt ? new Date(branch.updatedAt).toISOString() : null,
});

// GET all branches
router.get('/', async (req, res) => {
    try {
        const branches = await prisma.branchchurch.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(branches.map(shapeBranchForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch branch churches" });
    }
});

// POST a new branch
router.post('/', async (req, res) => {
    const { name, address, pastorName, phone, email, serviceTimes, mapEmbedUrl, imageUrl, description, establishedDate } = req.body;
    const estDate = establishedDate && !isNaN(new Date(establishedDate).getTime()) ? new Date(establishedDate) : null;
    const postedByOwnerId = '0';
    const postedByOwnerName = 'Admin System';

    try {
        const newBranch = await prisma.branchchurch.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                name, address, pastorName, phone, email, serviceTimes, mapEmbedUrl, imageUrl, description, 
                establishedDate: estDate,
                postedByOwnerId,
                postedByOwnerName,
            }
        });
        res.status(201).json(shapeBranchForFrontend(newBranch));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create branch church' });
    }
});

// PUT (update) a branch
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, address, pastorName, phone, email, serviceTimes, mapEmbedUrl, imageUrl, description, establishedDate } = req.body;
    const estDate = establishedDate && !isNaN(new Date(establishedDate).getTime()) ? new Date(establishedDate) : null;
    
    try {
        const updatedBranch = await prisma.branchchurch.update({
            where: { id },
            data: {
                name, address, pastorName, phone, email, serviceTimes, mapEmbedUrl, imageUrl, description,
                establishedDate: estDate,
                updatedAt: new Date(),
            }
        });
        res.json(shapeBranchForFrontend(updatedBranch));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Branch church not found.' });
        }
        res.status(500).json({ error: 'Failed to update branch church' });
    }
});

// DELETE a branch
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.branchchurch.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Branch church not found.' });
        }
        res.status(500).json({ error: 'Failed to delete branch church' });
    }
});

export default router;
