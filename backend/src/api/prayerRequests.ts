import express from 'express';
import { prisma } from '../db';
import { Prisma, prayerrequest_visibility, prayerrequest_status, prayerrequest_category } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { handleDatabaseFallback } from '../utils/databaseFallback';
import { generateId } from '../utils/generateId';

const router = express.Router();

const ensureAdmin = (req: express.Request, res: express.Response): boolean => {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Only administrators can perform this action.' });
        return false;
    }
    return true;
};

const normalizeMediaUrls = (value: unknown): any | undefined => {
    // Prisma field is Json? (can be array or string), but FE expects array.
    if (Array.isArray(value)) {
        const urls = value
            .map((v) => (typeof v === 'string' ? v.trim() : ''))
            .filter(Boolean);
        return urls.length ? urls : undefined;
    }
    if (typeof value === 'string') {
        const url = value.trim();
        return url ? [url] : undefined;
    }
    return undefined;
};

const normalizeLocation = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        const loc = value.trim();
        return loc || undefined;
    }
    if (value && typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return undefined;
        }
    }
    return undefined;
};

const shapePrayerRequestForFrontend = (item: any): any => {
    const { comment, prayer, ...rest } = item;
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
    const prayers = Array.isArray(prayer)
        ? prayer.map((p: any) => ({
            userId: p.userId,
            userName: p.userName,
            timestamp: p.timestamp ? new Date(p.timestamp).toISOString() : new Date().toISOString(),
        }))
        : [];
    return {
        ...rest,
        comments,
        prayers,
        submittedAt: rest.submittedAt ? new Date(rest.submittedAt).toISOString() : null,
        createdAt: rest.createdAt ? new Date(rest.createdAt).toISOString() : null,
        updatedAt: rest.updatedAt ? new Date(rest.updatedAt).toISOString() : null,
        moderatedAt: rest.moderatedAt ? new Date(rest.moderatedAt).toISOString() : null,
        // keep FE stable
        mediaUrls: rest.mediaUrls || [],
    };
};

// GET all prayer requests
router.get('/', async (req, res) => {
    try {
        const requests = await prisma.prayerrequest.findMany({
            where: { isDeleted: false },
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

// POST a new prayer request (all registered users)
router.post('/', authMiddleware, async (req, res) => {
    const requestUser = (req as any).user;
    if (!requestUser?.id) {
        return res.status(401).json({ error: 'Authentication required to submit a prayer request.' });
    }

    const { title, requestText, visibility, category, mediaUrls, location } = req.body;

    const trimmedTitle = String(title || '').trim();
    const trimmedRequestText = String(requestText || '').trim();

    const normalizedMediaUrls = normalizeMediaUrls(mediaUrls);
    const hasMedia = Boolean(normalizedMediaUrls && Array.isArray(normalizedMediaUrls) && normalizedMediaUrls.length);

    if (!trimmedRequestText && !hasMedia) {
        return res.status(400).json({ error: 'Prayer request text or media is required.' });
    }

    const resolvedVisibility = Object.values(prayerrequest_visibility).includes(visibility as prayerrequest_visibility)
        ? (visibility as prayerrequest_visibility)
        : prayerrequest_visibility.public;

    const resolvedCategory = Object.values(prayerrequest_category).includes(category as prayerrequest_category)
        ? (category as prayerrequest_category)
        : prayerrequest_category.Other;

    try {
        const user = await prisma.user.findUnique({ where: { id: requestUser.id } });
        if (!user) {
            return res.status(401).json({ error: 'User account not found.' });
        }

        const isAdmin = requestUser.role === 'admin';

        const newRequest = await prisma.prayerrequest.create({
            data: {
                id: generateId(),
                updatedAt: new Date(), // required (no default)
                title: trimmedTitle || trimmedRequestText.split(' ').slice(0, 7).join(' ') || 'Prayer Request',
                requestText: trimmedRequestText,
                visibility: resolvedVisibility,
                category: resolvedCategory,
                status: prayerrequest_status.active,
                mediaUrls: normalizedMediaUrls,
                location: normalizeLocation(location),
                postedByAdminId: isAdmin ? requestUser.id : undefined,
                postedByAdminName: isAdmin ? requestUser.fullName : undefined,
                userProfileImageUrl: user.profileImageUrl || undefined,
                userName: user.fullName,
                userId: user.id,
            }
        });

        res.status(201).json(shapePrayerRequestForFrontend(newRequest));
    } catch (error) {
        console.error('Failed to create prayer request:', error);
        res.status(500).json({ error: 'Failed to create prayer request' });
    }
});

// PUT (update) status of a prayer request (admin only)
router.put('/:id/status', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { status, adminNotes, moderationReason } = req.body;

    if (!Object.values(prayerrequest_status).includes(status as prayerrequest_status)) {
        return res.status(400).json({ error: 'Invalid status provided.' });
    }
    if (!moderationReason || !String(moderationReason).trim()) {
        return res.status(400).json({ error: 'A public reason is required for status updates.' });
    }

    try {
        const adminUser = (req as any).user;
        const updatedRequest = await prisma.prayerrequest.update({
            where: { id },
            data: {
                status: status as prayerrequest_status,
                adminNotes: adminNotes || undefined,
                moderationReason: String(moderationReason).trim(),
                moderatedAt: new Date(),
                moderatedByAdminId: adminUser?.id,
                moderatedByAdminName: adminUser?.fullName,
                updatedAt: new Date(),
            },
            include: { prayer: true, comment: true }
        });
        res.json(shapePrayerRequestForFrontend(updatedRequest));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Prayer request not found.' });
        }
        console.error('Failed to update prayer request status:', error);
        res.status(500).json({ error: 'Failed to update prayer request status.' });
    }
});

// POST to toggle a prayer on a request
router.post('/:id/toggle-prayer', async (req, res) => {
    const { id: prayerRequestId } = req.params;
    const { userId, userName, guestEmail, guestPhone } = req.body;

    const isLoggedIn = Boolean(userId);
    const isGuest = !isLoggedIn && Boolean(guestEmail || guestPhone);

    if (!isLoggedIn && !isGuest) {
        return res.status(400).json({ error: 'User ID or guest email/phone is required to pray.' });
    }

    if (isLoggedIn && !userName) {
        return res.status(400).json({ error: 'User Name is required.' });
    }

    try {
        const existingPrayer = isLoggedIn
            ? await prisma.prayer.findUnique({
                where: {
                    userId_prayerRequestId: {
                        userId,
                        prayerRequestId,
                    },
                },
            })
            : await prisma.prayer.findFirst({
                where: {
                    prayerRequestId,
                    ...(guestEmail ? { guestEmail } : {}),
                    ...(guestPhone ? { guestPhone } : {}),
                },
            });

        if (!existingPrayer) {
            await prisma.prayer.create({
                data: {
                    id: generateId(),
                    userId: isLoggedIn ? userId : null,
                    userName: isLoggedIn ? userName : 'Guest',
                    guestEmail: isGuest ? (guestEmail || null) : null,
                    guestPhone: isGuest ? (guestPhone || null) : null,
                    isGuest,
                    prayerRequestId,
                },
            });
        }

        await prisma.prayerrequest.update({
            where: { id: prayerRequestId },
            data: { lastPrayedAt: new Date(), updatedAt: new Date() }
        });

        const updatedRequest = await prisma.prayerrequest.findUnique({
            where: { id: prayerRequestId },
            include: { comment: true, prayer: true },
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
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'A public reason is required to delete a prayer request.' });
    }
    try {
        const adminUser = (req as any).user;
        const updated = await prisma.prayerrequest.update({
            where: { id },
            data: {
                isDeleted: true,
                moderationReason: String(reason).trim(),
                moderatedAt: new Date(),
                moderatedByAdminId: adminUser?.id,
                moderatedByAdminName: adminUser?.fullName,
                updatedAt: new Date(),
            },
        });
        res.json(shapePrayerRequestForFrontend(updated));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Prayer request not found.' });
        }
        console.error('Failed to delete prayer request:', error);
        res.status(500).json({ error: 'Failed to delete prayer request.' });
    }
});

export default router;
