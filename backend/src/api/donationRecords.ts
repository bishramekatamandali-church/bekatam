import express from 'express';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';

const router = express.Router();

// GET all donation records
router.get('/', async (req, res) => {
    try {
        const records = await prisma.donationrecord.findMany({
            orderBy: { donationDate: 'desc' },
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch donation records.' });
    }
});

// POST a new donation record
router.post('/', async (req, res) => {
    const { donorName, donorEmail, amount, purpose, donationDate, paymentMethod, transactionReference, notes, isReceiptSent, postedByOwnerId, postedByOwnerName } = req.body;

    if (!donorName || !donorEmail || !amount || !purpose || !donationDate) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        const newRecord = await prisma.donationrecord.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                donorName,
                donorEmail,
                amount: Number(amount),
                purpose,
                donationDate: new Date(donationDate),
                paymentMethod,
                transactionReference,
                notes,
                isReceiptSent: Boolean(isReceiptSent),
                postedByOwnerId: postedByOwnerId || 'system',
                postedByOwnerName: postedByOwnerName || 'System',
                transactionTimestamp: new Date(),
            }
        });
        res.status(201).json(newRecord);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create donation record.' });
    }
});

// PUT (update) a donation record
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { donorName, donorEmail, amount, purpose, donationDate, paymentMethod, transactionReference, notes, isReceiptSent } = req.body;
    
    try {
        const updatedRecord = await prisma.donationrecord.update({
            where: { id },
            data: {
                donorName,
                donorEmail,
                amount: Number(amount),
                purpose,
                donationDate: new Date(donationDate),
                paymentMethod,
                transactionReference,
                notes,
                isReceiptSent: Boolean(isReceiptSent),
                updatedAt: new Date(),
            }
        });
        res.json(updatedRecord);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Donation record not found.' });
        }
        res.status(500).json({ error: 'Failed to update donation record.' });
    }
});

// DELETE a donation record
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.donationrecord.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Donation record not found.' });
        }
        res.status(500).json({ error: 'Failed to delete donation record.' });
    }
});

export default router;