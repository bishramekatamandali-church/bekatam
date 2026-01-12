"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const databaseFallback_1 = require("../utils/databaseFallback");
const router = express_1.default.Router();
const shapeAboutSectionForFrontend = (section) => ({
    ...section,
    createdAt: section.createdAt ? new Date(section.createdAt).toISOString() : null,
    updatedAt: section.updatedAt ? new Date(section.updatedAt).toISOString() : null,
});
// GET all about sections
router.get('/', async (req, res) => {
    try {
        const sections = await db_1.prisma.aboutsection.findMany({
            orderBy: { displayOrder: 'asc' },
        });
        res.json(sections.map(shapeAboutSectionForFrontend));
    }
    catch (error) {
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Failed to fetch about sections" });
    }
});
// POST a new about section (custom only)
router.post('/', async (req, res) => {
    const { title, content, imageUrl, displayOrder } = req.body;
    const postedByAdminId = '0';
    const postedByAdminName = 'Admin System';
    try {
        const newSection = await db_1.prisma.aboutsection.create({
            data: {
                id: crypto_1.default.randomUUID(),
                updatedAt: new Date(),
                title,
                content,
                imageUrl,
                displayOrder: Number(displayOrder) || 0,
                isCoreSection: false, // Can only add custom sections via API
                postedByAdminId,
                postedByAdminName,
            }
        });
        res.status(201).json(shapeAboutSectionForFrontend(newSection));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create about section' });
    }
});
// PUT (update) an about section
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, imageUrl, displayOrder } = req.body;
    try {
        const sectionToUpdate = await db_1.prisma.aboutsection.findUnique({ where: { id } });
        if (!sectionToUpdate) {
            return res.status(404).json({ error: 'About section not found.' });
        }
        const updatedSection = await db_1.prisma.aboutsection.update({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update about section' });
    }
});
// DELETE a custom about section
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sectionToDelete = await db_1.prisma.aboutsection.findUnique({ where: { id } });
        if (!sectionToDelete) {
            return res.status(404).json({ error: 'About section not found.' });
        }
        if (sectionToDelete.isCoreSection) {
            return res.status(400).json({ error: 'Core about sections cannot be deleted.' });
        }
        await db_1.prisma.aboutsection.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete about section' });
    }
});
exports.default = router;
