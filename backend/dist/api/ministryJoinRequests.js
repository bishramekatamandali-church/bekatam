"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// GET all ministry join requests
router.get('/', async (req, res) => {
    try {
        const requests = await db_1.prisma.ministryjoinrequest.findMany({
            orderBy: { requestDate: 'desc' },
        });
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch ministry join requests.' });
    }
});
// POST a new ministry join request
router.post('/', async (req, res) => {
    const { userId, userName, userEmail, ministryId, ministryName, message, ministryGuidelines } = req.body;
    if (!userId || !userName || !userEmail || !ministryId || !ministryName) {
        return res.status(400).json({ error: 'Missing required fields for join request.' });
    }
    try {
        const newRequest = await db_1.prisma.ministryjoinrequest.create({
            data: {
                id: crypto_1.default.randomUUID(),
                userId,
                userName,
                userEmail,
                ministryId,
                ministryName,
                message: message || '',
                ministryGuidelines: ministryGuidelines || '',
                status: 'pending',
            }
        });
        res.status(201).json(newRequest);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create ministry join request.' });
    }
});
// PUT to update a request's status
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'A valid status is required.' });
    }
    try {
        const updatedRequest = await db_1.prisma.ministryjoinrequest.update({
            where: { id },
            data: {
                status,
                adminNotes: adminNotes || undefined,
                processedDate: new Date(),
            }
        });
        res.json(updatedRequest);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Ministry join request not found.' });
        }
        res.status(500).json({ error: 'Failed to update ministry join request status.' });
    }
});
exports.default = router;
