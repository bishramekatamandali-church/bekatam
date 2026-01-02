import express from 'express';
import { prisma } from '../db';
import crypto from "crypto";
import { Prisma } from '@prisma/client';

const router = express.Router();

// GET all collection records
router.get('/', async (req, res) => {
    try {
        const records = await prisma.collectionrecord.findMany({
            orderBy: { collectionDate: 'desc' },
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch collection records.' });
    }
});

// POST a new collection record
router.post('/', async (req, res) => {
    const { 
        collectorName, 
        collectionDate, 
        amount, 
        purpose, 
        source, 
        notes, 
        countedBy, 
        isDeposited, 
        depositDate, 
        bankDepositReference, 
        recordedByOwnerId, 
        recordedByOwnerName 
    } = req.body;

    if (!collectorName || !collectionDate || !amount || !purpose) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        const newRecord = await prisma.collectionrecord.create({
            data: {
                id: crypto.randomUUID(),                   // ✅ Required
                updatedAt: new Date(),                     // ✅ Required

                collectorName,
                collectionDate: new Date(collectionDate),
                amount: Number(amount),
                purpose,
                source,
                notes,
                countedBy,

                isDeposited: Boolean(isDeposited),
                depositDate: depositDate ? new Date(depositDate) : null,
                bankDepositReference,

                recordedByOwnerId: recordedByOwnerId || 'system',
                recordedByOwnerName: recordedByOwnerName || 'System',
                recordedAt: new Date(),
            }
        });

        res.status(201).json(newRecord);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to create collection record.' });
    }
});

// PUT update a record
router.put('/:id', async (req, res) => {
    const { id } = req.params;

    const { 
        collectorName, 
        collectionDate, 
        amount, 
        purpose, 
        source, 
        notes, 
        countedBy, 
        isDeposited, 
        depositDate, 
        bankDepositReference 
    } = req.body;
    
    try {
        const updatedRecord = await prisma.collectionrecord.update({
            where: { id },
            data: {
                collectorName,
                collectionDate: new Date(collectionDate),
                amount: Number(amount),
                purpose,
                source,
                notes,

                countedBy,
                isDeposited: Boolean(isDeposited),
                depositDate: depositDate ? new Date(depositDate) : null,
                bankDepositReference,

                updatedAt: new Date(),                     // ✅ Required
            }
        });

        res.json(updatedRecord);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Collection record not found.' });
        }
        res.status(500).json({ error: 'Failed to update collection record.' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.collectionrecord.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Collection record not found.' });
        }
        res.status(500).json({ error: 'Failed to delete collection record.' });
    }
});

export default router;
