import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';

const router = express.Router();

router.get('/admin', async (_req, res) => {
  try {
    const logs = await prisma.adminactionlog.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load admin activity logs.' });
  }
});

router.post('/admin', async (req, res) => {
  const { adminId, adminName, action, targetId, details } = req.body;

  if (!adminId || !adminName || !action) {
    return res.status(400).json({ error: 'Admin id, name, and action are required.' });
  }

  try {
    const created = await prisma.adminactionlog.create({
      data: {
        id: crypto.randomUUID(),
        adminId,
        adminName,
        action,
        targetId,
        details,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create admin action log.' });
  }
});

router.get('/frontend', async (_req, res) => {
  try {
    const logs = await prisma.frontendactivitylog.findMany({ orderBy: { timestamp: 'desc' } });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load activity logs.' });
  }
});

router.post('/frontend', async (req, res) => {
  const { userId, description, type, itemId, itemType } = req.body;

  if (!description || !type) {
    return res.status(400).json({ error: 'Description and type are required.' });
  }

  try {
    const created = await prisma.frontendactivitylog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        description,
        type,
        itemId,
        itemType,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity log.' });
  }
});

export default router;
