
import express from 'express';
import { prisma } from '../db';
import { Prisma, aboutsection } from '@prisma/client';

const router = express.Router();

const shapeAboutSectionForFrontend = (section: aboutsection): any => ({
    ...section,
    createdAt: section.createdAt ? new Date(section.createdAt).toISOString() : null,
    updatedAt: section.updatedAt ? new Date(section.updatedAt).toISOString() : null,
});

// GET all about sections
router.get('/', async (req, res) => {
    try {
        const sections = await prisma.aboutsection.findMany({
            orderBy: { displayOrder: 'asc' },
        });
        res.json(sections.map(shapeAboutSectionForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch about sections" });
    }
});

// POST a new about section (custom only)
router.post('/', async (req, res) => {
    const { title, content, imageUrl, displayOrder } = req.body;
    const postedByOwnerId = '0';
    const postedByOwnerName = 'Admin System';

    try {
        const newSection = await prisma.aboutsection.create({
            data: {
                id: crypto.randomUUID(),
                updatedAt: new Date(),
                title,
                content,
                imageUrl,
                displayOrder: Number(displayOrder) || 0,
                isCoreSection: false, // Can only add custom sections via API
                postedByOwnerId,
                postedByOwnerName,
            }
        });
        res.status(201).json(shapeAboutSectionForFrontend(newSection));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create about section' });
    }
});

// PUT (update) an about section
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, imageUrl, displayOrder } = req.body;
    
    try {
        const sectionToUpdate = await prisma.aboutsection.findUnique({ where: { id } });
        if (!sectionToUpdate) {
            return res.status(404).json({ error: 'About section not found.' });
        }

        const updatedSection = await prisma.aboutsection.update({
            where: { id },
            data: {
                title,
                content,
                imageUrl,
                displayOrder: sectionToUpdate.isCoreSection ? sectionToUpdate.displayOrder : (Number(displayOrder) || 0),
                updatedAt: new Date(),
            }
        });
        res.json(shapeAboutSectionForFrontend(updatedSection));
    } catch (error) {
        res.status(500).json({ error: 'Failed to update about section' });
    }
});

// DELETE a custom about section
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sectionToDelete = await prisma.aboutsection.findUnique({ where: { id } });
        if (!sectionToDelete) {
            return res.status(404).json({ error: 'About section not found.' });
        }
        if (sectionToDelete.isCoreSection) {
            return res.status(400).json({ error: 'Core about sections cannot be deleted.' });
        }

        await prisma.aboutsection.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete about section' });
    }
});

export default router;
