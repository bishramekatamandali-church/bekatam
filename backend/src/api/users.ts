import express from 'express';
import { prisma } from '../db';
import { authenticateToken } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = express.Router();

/**
 * Admin-only: list all users (safe fields only)
 * GET /api/users
 */
router.get('/', authenticateToken, authorizeAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (e) {
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
router.put('/:id/role', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: string };

    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: 'Invalid role. Allowed: user, admin' });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'User not found.' });

    // Enforce max admins = 3 when promoting user -> admin
    if (role === 'admin' && target.role !== 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount >= 3) {
        return res.status(400).json({ error: 'Max 3 admins allowed.' });
      }
    }

    const updated = await prisma.user.update({
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
  } catch (e) {
    console.error('PUT /api/users/:id/role error:', e);
    return res.status(500).json({ error: 'Failed to update role.' });
  }
});

export default router;
