import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const decisions = await prisma.decisionlog.findMany({ orderBy: { decisionDate: 'desc' } });
    res.json(decisions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load decision logs.' });
  }
});

router.post('/', async (req, res) => {
  const { decisionDate, title, description, madeBy, status, followUpActions, postedByOwnerId, postedByOwnerName } = req.body;

  if (!decisionDate || !title || !description || !madeBy) {
    return res.status(400).json({ error: 'Decision date, title, description, and made by are required.' });
  }

  try {
    const created = await prisma.decisionlog.create({
      data: {
        id: crypto.randomUUID(),
        decisionDate: new Date(decisionDate),
        title,
        description,
        madeBy,
        status,
        followUpActions,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create decision log.' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { decisionDate, title, description, madeBy, status, followUpActions, postedByOwnerId, postedByOwnerName } = req.body;

  try {
    const updated = await prisma.decisionlog.update({
      where: { id },
      data: {
        decisionDate: decisionDate ? new Date(decisionDate) : undefined,
        title,
        description,
        madeBy,
        status,
        followUpActions,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Decision log not found.' });
    }
    res.status(500).json({ error: 'Failed to update decision log.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.decisionlog.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Decision log not found.' });
    }
    res.status(500).json({ error: 'Failed to delete decision log.' });
  }
});

export default router;
