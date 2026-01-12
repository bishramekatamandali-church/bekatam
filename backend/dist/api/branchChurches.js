"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const databaseFallback_1 = require("../utils/databaseFallback");
const router = express_1.default.Router();
const shapeBranchForFrontend = (branch) => ({
    ...branch,
    linkPath: `/branches#${branch.id}`,
    establishedDate: branch.establishedDate ? new Date(branch.establishedDate).toISOString().split('T')[0] : null,
    createdAt: branch.createdAt ? new Date(branch.createdAt).toISOString() : null,
    updatedAt: branch.updatedAt ? new Date(branch.updatedAt).toISOString() : null,
});
// GET all branches
router.get('/', async (req, res) => {
    try {
        const branches = await db_1.prisma.branchchurch.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(branches.map(shapeBranchForFrontend));
    }
    catch (error) {
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Failed to fetch branch churches" });
    }
});
// POST a new branch
router.post('/', async (req, res) => {
    const { name, address, pastorName, phone, email, serviceTimes, mapEmbedUrl, imageUrl, description, establishedDate } = req.body;
    const estDate = establishedDate && !isNaN(new Date(establishedDate).getTime()) ? new Date(establishedDate) : null;
    const postedByAdminId = '0';
    const postedByAdminName = 'Admin System';
    try {
        const newBranch = await db_1.prisma.branchchurch.create({
            data: {
                id: crypto_1.default.randomUUID(), // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                name, address, pastorName, phone, email, serviceTimes, mapEmbedUrl, imageUrl, description,
                establishedDate: estDate,
                postedByAdminId,
                postedByAdminName,
            }
        });
        res.status(201).json(shapeBranchForFrontend(newBranch));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create branch church' });
    }
});
// PUT (update) a branch
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, address, pastorName, phone, email, serviceTimes, mapEmbedUrl, imageUrl, description, establishedDate } = req.body;
    const estDate = establishedDate && !isNaN(new Date(establishedDate).getTime()) ? new Date(establishedDate) : null;
    try {
        const updatedBranch = await db_1.prisma.branchchurch.update({
            where: { id },
            data: {
                name, address, pastorName, phone, email, serviceTimes, mapEmbedUrl, imageUrl, description,
                establishedDate: estDate,
                updatedAt: new Date(),
            }
        });
        res.json(shapeBranchForFrontend(updatedBranch));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Branch church not found.' });
        }
        res.status(500).json({ error: 'Failed to update branch church' });
    }
});
// DELETE a branch
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.branchchurch.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Branch church not found.' });
        }
        res.status(500).json({ error: 'Failed to delete branch church' });
    }
});
exports.default = router;
