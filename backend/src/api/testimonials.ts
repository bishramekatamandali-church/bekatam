import express from 'express';
import { prisma } from '../db';
import { Prisma, testimonial_visibility } from '@prisma/client';
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

const shapeTestimonialForFrontend = (item: any): any => {
    const { comment, ...rest } = item;
    const comments = Array.isArray(comment) ? comment.map((c: any) => ({
        id: c.id,
        itemId: rest.id,
        itemType: 'testimonial',
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
    return ({
        ...rest,
        comments,
        linkPath: `/testimonials#testimonial-${rest.id}`,
        submittedAt: rest.submittedAt ? new Date(rest.submittedAt).toISOString() : null,
        createdAt: rest.createdAt ? new Date(rest.createdAt).toISOString() : null,
        updatedAt: rest.updatedAt ? new Date(rest.updatedAt).toISOString() : null,
        moderatedAt: rest.moderatedAt ? new Date(rest.moderatedAt).toISOString() : null,
        mediaUrls: rest.mediaUrls || [],
    });
};

// GET all testimonials
router.get('/', async (req, res) => {
    try {
        const testimonials = await prisma.testimonial.findMany({
            where: { isDeleted: false },
            include: { comment: true },
            orderBy: { submittedAt: 'desc' },
        });
        res.json(testimonials.map(shapeTestimonialForFrontend));
    } catch (error) {
        if (handleDatabaseFallback(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Failed to fetch testimonials" });
    }
});

// POST a new testimonial (all registered users)
router.post('/', authMiddleware, async (req, res) => {
    const requestUser = (req as any).user;
    if (!requestUser?.id) {
        return res.status(401).json({ error: 'Authentication required to submit a testimonial.' });
    }

    const { title, contentText, visibility, mediaUrls, location } = req.body;

    const trimmedTitle = String(title || '').trim();
    const trimmedContentText = String(contentText || '').trim();
    const normalizedMediaUrls = normalizeMediaUrls(mediaUrls);
    const hasMedia = Boolean(normalizedMediaUrls && Array.isArray(normalizedMediaUrls) && normalizedMediaUrls.length);

    if (!trimmedTitle) {
        return res.status(400).json({ error: 'A title is required to submit a testimonial.' });
    }
    if (!trimmedContentText && !hasMedia) {
        return res.status(400).json({ error: 'Testimonial text or media is required.' });
    }

    const resolvedVisibility = Object.values(testimonial_visibility).includes(visibility as testimonial_visibility)
        ? (visibility as testimonial_visibility)
        : testimonial_visibility.public;

    try {
        const user = await prisma.user.findUnique({ where: { id: requestUser.id } });
        if (!user) {
            return res.status(401).json({ error: 'User account not found.' });
        }

        const isAdmin = requestUser.role === 'admin';

        const newTestimonial = await prisma.testimonial.create({
            data: {
                id: generateId(),
                updatedAt: new Date(), // required (no default)
                title: trimmedTitle,
                contentText: trimmedContentText,
                visibility: resolvedVisibility,
                mediaUrls: normalizedMediaUrls,
                location: normalizeLocation(location),
                postedByAdminId: isAdmin ? requestUser.id : undefined,
                postedByAdminName: isAdmin ? requestUser.fullName : undefined,
                userId: user.id,
                userName: user.fullName,
                userProfileImageUrl: user.profileImageUrl || undefined,
            }
        });

        res.status(201).json(shapeTestimonialForFrontend(newTestimonial));
    } catch (error) {
        console.error('Failed to create testimonial:', error);
        res.status(500).json({ error: 'Failed to create testimonial' });
    }
});

// PUT (update) a testimonial - admin only
router.put('/:id', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { title, contentText, visibility, moderationReason } = req.body;
    if (!moderationReason || !String(moderationReason).trim()) {
        return res.status(400).json({ error: 'A public reason is required for testimonial edits.' });
    }

    try {
        const adminUser = (req as any).user;
        const updatedTestimonial = await prisma.testimonial.update({
            where: { id },
            data: {
                title,
                contentText,
                visibility: visibility as testimonial_visibility,
                moderationReason: String(moderationReason).trim(),
                moderatedAt: new Date(),
                moderatedByAdminId: adminUser?.id,
                moderatedByAdminName: adminUser?.fullName,
                updatedAt: new Date(),
            }
        });
        res.json(shapeTestimonialForFrontend(updatedTestimonial));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        console.error('Failed to update testimonial:', error);
        res.status(500).json({ error: 'Failed to update testimonial' });
    }
});

// DELETE a testimonial - admin only
router.delete('/:id', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'A public reason is required to delete a testimonial.' });
    }
    try {
        const adminUser = (req as any).user;
        const updatedTestimonial = await prisma.testimonial.update({
            where: { id },
            data: {
                isDeleted: true,
                moderationReason: String(reason).trim(),
                moderatedAt: new Date(),
                moderatedByAdminId: adminUser?.id,
                moderatedByAdminName: adminUser?.fullName,
                updatedAt: new Date(),
            }
        });
        res.json(shapeTestimonialForFrontend(updatedTestimonial));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        console.error('Failed to delete testimonial:', error);
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});

export default router;
