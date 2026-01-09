import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';

const router = express.Router();

// Fetch all direct media uploads
router.get('/', async (_req, res) => {
  try {
    const items = await prisma.directmediaitem.findMany({
      orderBy: { uploadDate: 'desc' },
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load media library.' });
  }
});

// Create a new direct media item (images, audio, video, pdf, etc.)
router.post('/', async (req, res) => {
  const { title, description, url, mediaType, category, tags, postedByAdminId, postedByAdminName } = req.body;

  if (!title || !url || !mediaType) {
    return res.status(400).json({ error: 'Title, URL, and media type are required.' });
  }

  try {
    const created = await prisma.directmediaitem.create({
      data: {
        id: crypto.randomUUID(),
        title,
        description,
        url,
        mediaType,
        category,
        tags,
        postedByAdminId,
        postedByAdminName,
        updatedAt: new Date(),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save media item.' });
  }
});

// Update an existing media item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, url, mediaType, category, tags, postedByAdminId, postedByAdminName } = req.body;

  try {
    const updated = await prisma.directmediaitem.update({
      where: { id },
      data: {
        title,
        description,
        url,
        mediaType,
        category,
        tags,
        postedByAdminId,
        postedByAdminName,
        updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Media item not found.' });
    }
    res.status(500).json({ error: 'Failed to update media item.' });
  }
});

// Delete a media item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.directmediaitem.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Media item not found.' });
    }
    res.status(500).json({ error: 'Failed to delete media item.' });
  }
});

export default router;
