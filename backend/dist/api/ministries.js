"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const contentUpdates_1 = require("../services/contentUpdates");
const enumNormalization_1 = require("../utils/enumNormalization");
const router = express_1.default.Router();
const shapeMinistryForFrontend = (ministry) => ({
    ...ministry,
    linkPath: `/ministries/${ministry.id}`,
    // Frontend expects certain fields that might be null in DB
    leader: ministry.leader || '',
    meetingTime: ministry.meetingTime || '',
});
// GET all ministries
router.get('/', async (req, res) => {
    try {
        const ministries = await db_1.prisma.ministry.findMany({
            orderBy: { title: 'asc' },
        });
        res.json(ministries.map(shapeMinistryForFrontend));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch ministries' });
    }
});
// GET a single ministry by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const ministry = await db_1.prisma.ministry.findUnique({ where: { id } });
        if (ministry) {
            res.json(shapeMinistryForFrontend(ministry));
        }
        else {
            res.status(404).json({ error: 'Ministry not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch ministry' });
    }
});
// POST a new ministry
router.post('/', async (req, res) => {
    const { title, description, category, leader, meetingTime, imageUrl } = req.body;
    const id = crypto_1.default.randomUUID();
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.ministry_category);
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid ministry category.' });
    }
    try {
        const newMinistry = await db_1.prisma.ministry.create({
            data: {
                id,
                updatedAt: new Date(),
                title,
                description,
                category: normalizedCategory,
                leader,
                meetingTime,
                imageUrl,
                linkPath: `/ministries/${id}`,
            },
        });
        (0, contentUpdates_1.publishContentUpdate)({
            type: 'ministry',
            action: 'created',
            id: newMinistry.id,
            timestamp: new Date().toISOString(),
        });
        res.status(201).json(shapeMinistryForFrontend(newMinistry));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create ministry' });
    }
});
// PUT (update) a ministry
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, category, leader, meetingTime, imageUrl } = req.body;
    const normalizedCategory = (0, enumNormalization_1.normalizeEnumValue)(category, client_1.ministry_category);
    if (category && !normalizedCategory) {
        return res.status(400).json({ error: 'Invalid ministry category.' });
    }
    try {
        const updatedMinistry = await db_1.prisma.ministry.update({
            where: { id },
            data: {
                title,
                description,
                category: normalizedCategory,
                leader,
                meetingTime,
                imageUrl,
                updatedAt: new Date(),
            },
        });
        (0, contentUpdates_1.publishContentUpdate)({
            type: 'ministry',
            action: 'updated',
            id: updatedMinistry.id,
            timestamp: new Date().toISOString(),
        });
        res.json(shapeMinistryForFrontend(updatedMinistry));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Ministry not found.' });
        }
        res.status(500).json({ error: 'Failed to update ministry' });
    }
});
// DELETE a ministry
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.ministry.delete({ where: { id } });
        (0, contentUpdates_1.publishContentUpdate)({
            type: 'ministry',
            action: 'deleted',
            id,
            timestamp: new Date().toISOString(),
        });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Ministry not found.' });
        }
        res.status(500).json({ error: 'Failed to delete ministry' });
    }
});
exports.default = router;
