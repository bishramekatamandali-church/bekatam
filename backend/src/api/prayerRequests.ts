



































import express from 'express';
import crypto from 'crypto';
import { prisma } from '../db';
import { Prisma, prayerrequest, prayerrequest_visibility, prayerrequest_status } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { handleDatabaseFallback } from '../utils/databaseFallback';

const router = express.Router();

const ensureAdmin = (req: express.Request, res: express.Response): boolean => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Only administrators can perform this action.' });
        return false;
    }
    return true;
};

const shapePrayerRequestForFrontend = (item: any): any => {
    const { comment, ...rest } = item;
    const comments = Array.isArray(comment) ? comment.map((c: any) => ({
        id: c.id,
        itemId: rest.id,
        itemType: 'prayerRequest',
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
        ...rest,
        comments,
        createdAt: rest.createdAt ? new Date(rest.createdAt).toISOString() : null,
        updatedAt: rest.updatedAt ? new Date(rest.updatedAt).toISOString() : null,
    };
};


// GET all prayer requests
router.get('/', async (req, res) => {
    try {
        const requests = await prisma.prayerrequest.findMany({
  include: {
    comment: true,
    prayer: true,
  },
  orderBy: { submittedAt: 'desc' },
});


        res.json(requests.map(shapePrayerRequestForFrontend));
    } catch (error) {
        if (handleDatabaseFallback(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Failed to fetch prayer requests" });
    }
});

// POST a new prayer request (admin only)
router.post('/', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { title, requestText, visibility, category, mediaUrls, location, postedByAdminId, postedByAdminName, userProfileImageUrl, userName, userId } = req.body;

    try {
        const newRequest = await prisma.prayerrequest.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                title,
                requestText,
                visibility: visibility as prayerrequest_visibility,
                category,
                status: 'active',
                mediaUrls: mediaUrls || undefined,
                location,
                postedByAdminId,
                postedByAdminName,
                userProfileImageUrl,
                userName,
                userId,
            }
        });
        res.status(201).json(shapePrayerRequestForFrontend(newRequest));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create prayer request' });
    }
});

// PUT (update) status of a prayer request (admin only)
router.put('/:id/status', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!Object.values(prayerrequest_status).includes(status as prayerrequest_status)) {
        return res.status(400).json({ error: 'Invalid status provided.' });
    }

    try {
        const updatedRequest = await prisma.prayerrequest.update({
            where: { id },
            data: {
                status: status as prayerrequest_status,
                adminNotes: adminNotes || undefined,
                updatedAt: new Date(),
            },
            include: { prayer: true }
        });
        res.json(shapePrayerRequestForFrontend(updatedRequest));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Prayer request not found.' });
        }
        res.status(500).json({ error: 'Failed to update prayer request status.' });
    }
});


// POST to toggle a prayer on a request
router.post('/:id/toggle-prayer', async (req, res) => {
    const { id: prayerRequestId } = req.params;
    const { userId, userName } = req.body;

    if (!userId || !userName) {
        return res.status(400).json({ error: 'User ID and User Name are required.' });
    }

    try {
        const existingPrayer = await prisma.prayer.findUnique({
            where: {
                userId_prayerRequestId: {
                    userId,
                    prayerRequestId,
                },
            },
        });

        if (existingPrayer) {
            // User has already prayed, so we "un-pray" by deleting the record
            await prisma.prayer.delete({ where: { id: existingPrayer.id } });
        } else {
            // User has not prayed, so we create a new prayer record
            await prisma.prayer.create({
                data: {
                    id: crypto.randomUUID(), // REQUIRED in your schema
                    userId,
                    userName, // Storing userName for convenience, though it could be denormalized
                    prayerRequestId,
                },
            });
        }
        
        // Update the lastPrayedAt timestamp on the parent request
        await prisma.prayerrequest.update({
            where: { id: prayerRequestId },
            data: { lastPrayedAt: new Date() }
        });

        // Fetch the updated prayer request with the new prayer list
        const updatedRequest = await prisma.prayerrequest.findUnique({
  where: { id: prayerRequestId },
  include: {
    comment: true,
    prayer: true,
  },
});



        if (!updatedRequest) {
            return res.status(404).json({ error: "Prayer request not found after toggling prayer." });
        }

        res.json(shapePrayerRequestForFrontend(updatedRequest));
    } catch (error) {
        console.error(`Error toggling prayer for request ${prayerRequestId}:`, error);
        res.status(500).json({ error: 'Failed to toggle prayer.' });
    }
});


// DELETE a prayer request (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    try {
        // Prisma's onDelete: Cascade will handle deleting related comments and prayers
        await prisma.prayerrequest.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Prayer request not found.' });
        }
        res.status(500).json({ error: 'Failed to delete prayer request' });
    }
});


export default router; 
