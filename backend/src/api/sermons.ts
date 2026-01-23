import crypto from 'crypto';
import express from 'express';
import { prisma } from '../db';
import { Prisma, sermon_category } from '@prisma/client';
import { publishContentUpdate } from '../services/contentUpdates';
import { normalizeEnumValue } from '../utils/enumNormalization';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

const isMissingColumnError = (error: unknown, column: string): boolean => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') {
        const message = typeof error.message === 'string' ? error.message : '';
        return message.includes(column);
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
        return error.message.includes(column);
    }
    return false;
};

const getMissingSermonColumns = (error: unknown) => {
    const missing = new Set<string>();
    if (isMissingColumnError(error, 'postedByAdminId')) {
        missing.add('postedByAdminId');
    }
    if (isMissingColumnError(error, 'postedByAdminName')) {
        missing.add('postedByAdminName');
    }
    if (isMissingColumnError(error, 'location')) {
        missing.add('location');
    }
    return missing;
};

const buildSermonSelect = (includeAdminFields: boolean, includeLocation: boolean) => ({
    id: true,
    title: true,
    description: true,
    imageUrl: true,
    linkPath: true,
    category: true,
    date: true,
    ...(includeAdminFields ? { postedByAdminId: true, postedByAdminName: true } : {}),
    ...(includeLocation ? { location: true } : {}),
    createdAt: true,
    updatedAt: true,
    speaker: true,
    scripture: true,
    videoUrl: true,
    audioUrl: true,
    fullContent: true,
    likes: true,
    comment: true,
});

const removeMissingColumns = <T extends Record<string, unknown>>(data: T, missing: Set<string>): T => {
    if (missing.size === 0) {
        return data;
    }
    const pruned: T = { ...data };
    for (const column of missing) {
        delete (pruned as Record<string, unknown>)[column];
    }
    return pruned;
};

// Helper to ensure the sermon object sent to the frontend has the expected shape
const shapeSermonForFrontend = (s: any): any => {
    const { comment, ...sermon } = s;
    const comments = Array.isArray(comment) ? comment.map((c: any) => ({
        id: c.id,
        itemId: sermon.id,
        itemType: 'sermon',
        userId: c.userId ?? null,
        userName: c.userName,
        userProfileImageUrl: c.userProfileImageUrl ?? null,
        isGuest: c.isGuest ?? false,
        guestEmail: c.guestEmail ?? null,
        guestPhone: c.guestPhone ?? null,
        text: c.text,
        timestamp: c.timestamp ? new Date(c.timestamp).toISOString() : new Date().toISOString(),
        editedAt: c.editedAt ? new Date(c.editedAt).toISOString() : null,
    })) : [];
    comments.sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return {
        ...sermon,
        comments,
        linkPath: `/sermons/${sermon.id}`,
        date: sermon.date ? new Date(sermon.date).toISOString() : null,
        createdAt: sermon.createdAt ? new Date(sermon.createdAt).toISOString() : null,
        updatedAt: sermon.updatedAt ? new Date(sermon.updatedAt).toISOString() : null,
        likes: sermon.likes || 0,
    };
};

// GET all sermons
router.get('/', async (req, res) => {
    try {
        const sermons = await prisma.sermon.findMany({
            select: buildSermonSelect(true, true),
            orderBy: { date: 'desc' },
        });
        const shapedSermons = sermons.map(shapeSermonForFrontend);
        res.json(shapedSermons);
    } catch (error) {
        const missingColumns = getMissingSermonColumns(error);
        if (missingColumns.size > 0) {
            try {
                const sermons = await prisma.sermon.findMany({
                    select: buildSermonSelect(
                        !missingColumns.has('postedByAdminId') && !missingColumns.has('postedByAdminName'),
                        !missingColumns.has('location')
                    ),
                    orderBy: { date: 'desc' },
                });
                const shapedSermons = sermons.map(shapeSermonForFrontend);
                res.json(shapedSermons);
                return;
            } catch (fallbackError) {
                if (handleDatabaseFallback(req, res, fallbackError)) {
                    return;
                }
                console.error("Error fetching sermons without location:", fallbackError);
                res.status(500).json({ error: "Failed to fetch sermons" });
                return;
            }
        }
        if (handleDatabaseFallback(req, res, error)) {
            return;
        }
        console.error("Error fetching sermons:", error);
        res.status(500).json({ error: "Failed to fetch sermons" });
    }
});

// GET a single sermon by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const sermon = await prisma.sermon.findUnique({
            where: { id: id },
            select: buildSermonSelect(true, true),
        });
        if (sermon) {
            res.json(shapeSermonForFrontend(sermon));
        } else {
            res.status(404).json({ error: "Sermon not found" });
        }
    } catch (error) {
        const missingColumns = getMissingSermonColumns(error);
        if (missingColumns.size > 0) {
            try {
                const sermon = await prisma.sermon.findUnique({
                    where: { id: id },
                    select: buildSermonSelect(
                        !missingColumns.has('postedByAdminId') && !missingColumns.has('postedByAdminName'),
                        !missingColumns.has('location')
                    ),
                });
                if (sermon) {
                    res.json(shapeSermonForFrontend(sermon));
                } else {
                    res.status(404).json({ error: "Sermon not found" });
                }
                return;
            } catch (fallbackError) {
                console.error(`Error fetching sermon with id "${id}" without location:`, fallbackError);
                res.status(500).json({ error: "Failed to fetch sermon" });
                return;
            }
        }
        console.error(`Error fetching sermon with id "${id}":`, error);
        res.status(500).json({ error: "Failed to fetch sermon" });
    }
});

// POST a new sermon
router.post('/', async (req, res) => {
    const { id: requestedId, linkPath: requestedLinkPath, title, description, date, category, speaker, scripture, videoUrl, audioUrl, fullContent, imageUrl, postedByAdminId, postedByAdminName, location } = req.body;
    
    // Validate date before creating a Date object. Pass null if date is invalid or not provided.
    const sermonDate =
  date && !isNaN(new Date(date).getTime()) ? new Date(date) : null;

if (!sermonDate) {
  return res.status(400).json({ error: 'Sermon date is required (valid date).' });
}

if (typeof title !== 'string' || !title.trim()) {
  return res.status(400).json({ error: 'Title is required.' });
}

if (typeof description !== 'string' || !description.trim()) {
  return res.status(400).json({ error: 'Description is required.' });
}
    const id = typeof requestedId === 'string' && requestedId.trim().length > 0 ? requestedId : crypto.randomUUID();
    const linkPath = requestedLinkPath || `/sermons/${id}`;
    const categoryInput =
  category === undefined || category === null || category === '' ? undefined : category;

const normalizedCategory =
  categoryInput !== undefined ? normalizeEnumValue(categoryInput, sermon_category) : undefined;

if (categoryInput !== undefined && !normalizedCategory) {
  return res.status(400).json({ error: 'Invalid sermon category.' });
}


    try {
        const newSermon = await prisma.sermon.create({
            data: {
  id,
  createdAt: new Date(),   // ✅ ADD THIS
  updatedAt: new Date(),
  title,
  description,
  date: sermonDate,
  category: normalizedCategory,
  speaker,
  scripture,
  videoUrl,
  audioUrl,
  fullContent,
  imageUrl,
  postedByAdminId,
  postedByAdminName,
  location,
  linkPath,
}

        });
    try {
  publishContentUpdate({ type: 'sermon', action: 'created', id: newSermon.id, timestamp: new Date().toISOString() });
} catch (e) {
  console.error('publishContentUpdate failed (create sermon):', e);
}

        res.status(201).json(shapeSermonForFrontend(newSermon));
    } catch (error) {
        const missingColumns = getMissingSermonColumns(error);
        if (missingColumns.size > 0) {
            try {
                const newSermon = await prisma.sermon.create({
                    data: removeMissingColumns({
                        id,
                        createdAt: new Date(),   // ✅ add this
                        updatedAt: new Date(),
                        title,
                        description,
                        date: sermonDate,
                        category: normalizedCategory,
                        speaker,
                        scripture,
                        videoUrl,
                        audioUrl,
                        fullContent,
                        imageUrl,
                        postedByAdminId,
                        postedByAdminName,
                        location,
                        linkPath,
                    }, missingColumns),
                });
                publishContentUpdate({ type: 'sermon', action: 'created', id: newSermon.id, timestamp: new Date().toISOString() });
                res.status(201).json(shapeSermonForFrontend(newSermon));
                return;
            } catch (fallbackError) {
                console.error("Error creating sermon without location:", fallbackError);
                if (fallbackError instanceof Prisma.PrismaClientKnownRequestError) {
                    return res.status(400).json({ error: 'Database error creating sermon.', details: fallbackError.message });
                }
                res.status(500).json({ error: 'Failed to create sermon' });
                return;
            }
        }
        console.error("Error creating sermon:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return res.status(400).json({ error: 'Database error creating sermon.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to create sermon' });
    }
});

// PUT (update) a sermon
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, date, category, speaker, scripture, videoUrl, audioUrl, fullContent, imageUrl, postedByAdminId, postedByAdminName, location } = req.body;

    // Validate date before creating a Date object. Pass null if date is invalid or not provided.
    const sermonDate =
  date === undefined || date === null || date === ''
    ? undefined
    : !isNaN(new Date(date).getTime())
      ? new Date(date)
      : null;

if (sermonDate === null) {
  return res.status(400).json({ error: 'Invalid sermon date.' });
}

if (title === null) {
  return res.status(400).json({ error: 'Title cannot be null.' });
}
if (description === null) {
  return res.status(400).json({ error: 'Description cannot be null.' });
}
    const categoryInput =
  category === undefined || category === null || category === '' ? undefined : category;

const normalizedCategory =
  categoryInput !== undefined ? normalizeEnumValue(categoryInput, sermon_category) : undefined;

if (categoryInput !== undefined && !normalizedCategory) {
  return res.status(400).json({ error: 'Invalid sermon category.' });
}


    try {
        const updatedSermon = await prisma.sermon.update({
            where: { id: id },
            data: {
                title,
                description,
                ...(sermonDate !== undefined ? { date: sermonDate } : {}),
                ...(normalizedCategory !== undefined ? { category: normalizedCategory } : {}),
                speaker,
                scripture,
                videoUrl,
                audioUrl,
                fullContent,
                imageUrl,
                postedByAdminId,
                postedByAdminName,
                location,
                updatedAt: new Date(),
            }
        });
    try {
  publishContentUpdate({ type: 'sermon', action: 'updated', id: updatedSermon.id, timestamp: new Date().toISOString() });
} catch (e) {
  console.error('publishContentUpdate failed (update sermon):', e);
}

        res.json(shapeSermonForFrontend(updatedSermon));
    } catch (error) {
        const missingColumns = getMissingSermonColumns(error);
        if (missingColumns.size > 0) {
            try {
                const updatedSermon = await prisma.sermon.update({
                    where: { id: id },
                    data: removeMissingColumns({
                        title,
                        description,
                        date: sermonDate,
                        ...(normalizedCategory !== undefined ? { category: normalizedCategory } : {}),
                        speaker,
                        scripture,
                        videoUrl,
                        audioUrl,
                        fullContent,
                        imageUrl,
                        postedByAdminId,
                        postedByAdminName,
                        location,
                        updatedAt: new Date(),
                    }, missingColumns),
                });
                publishContentUpdate({ type: 'sermon', action: 'updated', id: updatedSermon.id, timestamp: new Date().toISOString() });
                res.json(shapeSermonForFrontend(updatedSermon));
                return;
            } catch (fallbackError) {
                console.error(`Error updating sermon with id "${id}" without location:`, fallbackError);
                if (fallbackError instanceof Prisma.PrismaClientKnownRequestError) {
                    if (fallbackError.code === 'P2025') {
                        return res.status(404).json({ error: 'Sermon to update not found.' });
                    }
                    return res.status(400).json({ error: 'Database error updating sermon.', details: fallbackError.message });
                }
                res.status(500).json({ error: 'Failed to update sermon' });
                return;
            }
        }
        console.error(`Error updating sermon with id "${id}":`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                 return res.status(404).json({ error: 'Sermon to update not found.' });
            }
            return res.status(400).json({ error: 'Database error updating sermon.', details: error.message });
        }
        res.status(500).json({ error: 'Failed to update sermon' });
    }
});

// DELETE a sermon
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Delete related comments (your schema uses sermonId)
    try {
      await prisma.comment.deleteMany({ where: { sermonId: id } });
    } catch (commentError) {
      if (
        commentError instanceof Prisma.PrismaClientKnownRequestError &&
        (commentError.code === 'P2021' || commentError.code === 'P2022')
      ) {
        console.warn('Skipping comment cleanup due to missing comment schema.', commentError.message);
      } else {
        throw commentError;
      }
    }

    await prisma.sermon.delete({ where: { id } });

    // Do not fail the API if publish fails
    try {
      publishContentUpdate({ type: 'sermon', action: 'deleted', id, timestamp: new Date().toISOString() });
    } catch (e) {
      console.error('publishContentUpdate failed (delete sermon):', e);
    }

    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting sermon with id "${id}":`, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Sermon to delete not found.' });
      }
      if (error.code === 'P2003') {
        return res.status(409).json({ error: 'Cannot delete sermon due to related records.' });
      }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
  return res.status(500).json({
    error: 'Failed to delete sermon',
    code: error.code,
    details: error.message,
  });
}

if (error instanceof Prisma.PrismaClientValidationError) {
  return res.status(500).json({
    error: 'Failed to delete sermon',
    details: error.message,
  });
}

res.status(500).json({ error: 'Failed to delete sermon' });

  }
});


export default router; 
