
import express from 'express';
import { prisma } from '../db';
import { Prisma, keyperson } from '@prisma/client';

const router = express.Router();

const shapeKeyPersonForFrontend = (person: keyperson): any => ({
    ...person,
    createdAt: person.createdAt ? new Date(person.createdAt).toISOString() : null,
    updatedAt: person.updatedAt ? new Date(person.updatedAt).toISOString() : null,
});

// GET all key persons
router.get('/', async (req, res) => {
    try {
        const persons = await prisma.keyperson.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(persons.map(shapeKeyPersonForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch key persons" });
    }
});

// POST a new key person
router.post('/', async (req, res) => {
    const { name, role, bio, imageUrl } = req.body;
    const postedByOwnerId = '0';
    const postedByOwnerName = 'Admin System';

    try {
        const newPerson = await prisma.keyperson.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                name,
                role,
                bio,
                imageUrl,
                postedByOwnerId,
                postedByOwnerName,
            }
        });
        res.status(201).json(shapeKeyPersonForFrontend(newPerson));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create key person' });
    }
});

// PUT (update) a key person
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, role, bio, imageUrl } = req.body;
    
    try {
        const updatedPerson = await prisma.keyperson.update({
            where: { id },
            data: { name, role, bio, imageUrl, updatedAt: new Date() }
        });
        res.json(shapeKeyPersonForFrontend(updatedPerson));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Key person not found.' });
        }
        res.status(500).json({ error: 'Failed to update key person' });
    }
});

// DELETE a key person
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.keyperson.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Key person not found.' });
        }
        res.status(500).json({ error: 'Failed to delete key person' });
    }
});

export default router;
