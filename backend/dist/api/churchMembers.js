"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const db_1 = require("../db");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
router.get('/', async (_req, res) => {
    try {
        const members = await db_1.prisma.churchmember.findMany({ orderBy: { memberSince: 'desc' } });
        res.json(members);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load church members.' });
    }
});
router.post('/', async (req, res) => {
    const { userId, fullName, username, contactPhone, contactEmail, address, memberSince, dateOfBirth, baptismDate, familyMembers, notes, isActiveMember, profileImageUrl, postedByAdminId, postedByAdminName } = req.body;
    if (!fullName || !memberSince) {
        return res.status(400).json({ error: 'Full name and member since date are required.' });
    }
    try {
        const created = await db_1.prisma.churchmember.create({
            data: {
                id: crypto_1.default.randomUUID(),
                userId: userId || null,
                fullName,
                username,
                contactPhone,
                contactEmail,
                address,
                memberSince: new Date(memberSince),
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                baptismDate: baptismDate ? new Date(baptismDate) : null,
                familyMembers,
                notes,
                isActiveMember: Boolean(isActiveMember),
                profileImageUrl,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create church member.' });
    }
});
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { userId, fullName, username, contactPhone, contactEmail, address, memberSince, dateOfBirth, baptismDate, familyMembers, notes, isActiveMember, profileImageUrl, postedByAdminId, postedByAdminName } = req.body;
    try {
        const updated = await db_1.prisma.churchmember.update({
            where: { id },
            data: {
                userId: userId || null,
                fullName,
                username,
                contactPhone,
                contactEmail,
                address,
                memberSince: memberSince ? new Date(memberSince) : undefined,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                baptismDate: baptismDate ? new Date(baptismDate) : null,
                familyMembers,
                notes,
                isActiveMember: Boolean(isActiveMember),
                profileImageUrl,
                postedByAdminId,
                postedByAdminName,
                updatedAt: new Date(),
            },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Church member not found.' });
        }
        res.status(500).json({ error: 'Failed to update church member.' });
    }
});
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.churchmember.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Church member not found.' });
        }
        res.status(500).json({ error: 'Failed to delete church member.' });
    }
});
exports.default = router;
