import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';

const router = express.Router();

// List ads with newest first
router.get('/', async (_req, res) => {
  try {
    const ads = await prisma.advertisement.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load advertisements.' });
  }
});

// Create ad
router.post('/', async (req, res) => {
  const { name, adType, imageUrl, videoUrl, linkUrl, altText, placements, startDate, endDate, isActive, displayOrder, adSizeKey, postedByOwnerId, postedByOwnerName } = req.body;

  if (!name || !adType) {
    return res.status(400).json({ error: 'Name and ad type are required.' });
  }

  try {
    const created = await prisma.advertisement.create({
      data: {
        id: crypto.randomUUID(),
        name,
        adType,
        imageUrl,
        videoUrl,
        linkUrl,
        altText,
        placements: placements ?? [],
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: Boolean(isActive),
        displayOrder: displayOrder ?? null,
        adSizeKey,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create advertisement.' });
  }
});

// Update ad
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, adType, imageUrl, videoUrl, linkUrl, altText, placements, startDate, endDate, isActive, displayOrder, adSizeKey, postedByOwnerId, postedByOwnerName } = req.body;

  try {
    const updated = await prisma.advertisement.update({
      where: { id },
      data: {
        name,
        adType,
        imageUrl,
        videoUrl,
        linkUrl,
        altText,
        placements: placements ?? [],
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: Boolean(isActive),
        displayOrder,
        adSizeKey,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Advertisement not found.' });
    }
    res.status(500).json({ error: 'Failed to update advertisement.' });
  }
});

// Delete ad
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.advertisement.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Advertisement not found.' });
    }
    res.status(500).json({ error: 'Failed to delete advertisement.' });
  }
});

export default router;
