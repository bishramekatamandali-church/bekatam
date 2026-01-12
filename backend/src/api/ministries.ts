
import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, ministry, ministry_category } from '@prisma/client';
import { publishContentUpdate } from '../services/contentUpdates';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback'

const router = express.Router();

const shapeMinistryForFrontend = (ministry: ministry): any => ({
  ...ministry,
  linkPath: `/ministries/${ministry.id}`,
  // Frontend expects certain fields that might be null in DB
  leader: ministry.leader || '',
  meetingTime: ministry.meetingTime || '',
});

// GET all ministries
router.get('/', async (req, res) => {
  try {
    const ministries = await prisma.ministry.findMany({
      orderBy: { title: 'asc' },
    });
    res.json(ministries.map(shapeMinistryForFrontend));
  } catch (error) {
      if (handleDatabaseFallback(req, res, error)) {
      return;
    }
    res.status(500).json({ error: 'Failed to fetch ministries' });
  }
});

// GET a single ministry by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const ministry = await prisma.ministry.findUnique({ where: { id } });
    if (ministry) {
      res.json(shapeMinistryForFrontend(ministry));
    } else {
      res.status(404).json({ error: 'Ministry not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ministry' });
  }
});

// POST a new ministry
router.post('/', async (req, res) => {
  const { title, description, category, leader, meetingTime, imageUrl } = req.body;
  const id = crypto.randomUUID();

  const normalizedCategory = normalizeEnumValue(category, ministry_category);

  if (category && !normalizedCategory) {
    return res.status(400).json({ error: 'Invalid ministry category.' });
  }

  try {
    const newMinistry = await prisma.ministry.create({
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

    publishContentUpdate({
      type: 'ministry',
      action: 'created',
      id: newMinistry.id,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(shapeMinistryForFrontend(newMinistry));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ministry' });
  }
});

// PUT (update) a ministry
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, category, leader, meetingTime, imageUrl } = req.body;

  const normalizedCategory = normalizeEnumValue(category, ministry_category);

  if (category && !normalizedCategory) {
    return res.status(400).json({ error: 'Invalid ministry category.' });
  }

  try {
    const updatedMinistry = await prisma.ministry.update({
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

    publishContentUpdate({
      type: 'ministry',
      action: 'updated',
      id: updatedMinistry.id,
      timestamp: new Date().toISOString(),
    });

    res.json(shapeMinistryForFrontend(updatedMinistry));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Ministry not found.' });
    }
    res.status(500).json({ error: 'Failed to update ministry' });
  }
});

// DELETE a ministry
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.ministry.delete({ where: { id } });

    publishContentUpdate({
      type: 'ministry',
      action: 'deleted',
      id,
      timestamp: new Date().toISOString(),
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Ministry not found.' });
    }
    res.status(500).json({ error: 'Failed to delete ministry' });
  }
});

export default router;
