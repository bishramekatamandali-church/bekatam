"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const router = express_1.default.Router();
/**
 * Admin-only: list all users (safe fields only)
 * GET /api/users
 */
router.get('/', auth_1.authenticateToken, authorize_1.authorizeAdmin, async (_req, res) => {
    try {
        const users = await db_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                phone: true,
                countryCode: true,
                role: true,
                profileImageUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.json(users);
    }
    catch (e) {
        console.error('GET /api/users error:', e);
        return res.status(500).json({ error: 'Failed to fetch users.' });
    }
});
/**
 * Admin-only: update a user's role
 * PUT /api/users/:id/role
 * body: { role: "user" | "admin" }
 *
 * Safety: limit max admins to 3 (based on your frontend note)
 */
router.put('/:id/role', auth_1.authenticateToken, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (role !== 'user' && role !== 'admin') {
            return res.status(400).json({ error: 'Invalid role. Allowed: user, admin' });
        }
        const target = await db_1.prisma.user.findUnique({ where: { id } });
        if (!target)
            return res.status(404).json({ error: 'User not found.' });
        // Enforce max admins = 3 when promoting user -> admin
        if (role === 'admin' && target.role !== 'admin') {
            const adminCount = await db_1.prisma.user.count({ where: { role: 'admin' } });
            if (adminCount >= 3) {
                return res.status(400).json({ error: 'Max 3 admins allowed.' });
            }
        }
        const updated = await db_1.prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                phone: true,
                countryCode: true,
                role: true,
                profileImageUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return res.json({ success: true, user: updated });
    }
    catch (e) {
        console.error('PUT /api/users/:id/role error:', e);
        return res.status(500).json({ error: 'Failed to update role.' });
    }
});
exports.default = router;
