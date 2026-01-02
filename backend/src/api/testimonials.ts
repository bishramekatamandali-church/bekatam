
import express from 'express';
import { prisma } from '../db';
import { Prisma, testimonial, testimonial_visibility } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

const ensureAdmin = (req: express.Request, res: express.Response): boolean => {
    const user = (req as any).user;
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        res.status(403).json({ error: 'Only administrators can perform this action.' });
        return false;
    }
    return true;
};

const shapeTestimonialForFrontend = (testimonial: testimonial): any => ({
    ...testimonial,
    linkPath: `/testimonials#testimonial-${testimonial.id}`, // Example, frontend might not have a dedicated page
    submittedAt: new Date(testimonial.submittedAt).toISOString(),
    createdAt: testimonial.createdAt ? new Date(testimonial.createdAt).toISOString() : null,
    updatedAt: testimonial.updatedAt ? new Date(testimonial.updatedAt).toISOString() : null,
    mediaUrls: testimonial.mediaUrls || [],
});

// GET all testimonials
router.get('/', async (req, res) => {
    try {
        const testimonials = await prisma.testimonial.findMany({
            orderBy: { submittedAt: 'desc' },
        });
        res.json(testimonials.map(shapeTestimonialForFrontend));
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch testimonials" });
    }
});

// POST a new testimonial (admin only)
router.post('/', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { title, contentText, visibility, mediaUrls, location, taggedFriends, feelingActivity, backgroundTheme, postedByOwnerId, postedByOwnerName, userId, userName, userProfileImageUrl } = req.body;

    try {
        const newTestimonial = await prisma.testimonial.create({
            data: {
                id: crypto.randomUUID(), // REQUIRED in your schema
    updatedAt: new Date(),   // REQUIRED
                title,
                contentText,
                visibility: visibility as testimonial_visibility,
                mediaUrls: mediaUrls || undefined,
                location,
                taggedFriends,
                feelingActivity,
                backgroundTheme,
                postedByOwnerId,
                postedByOwnerName,
                userId,
                userName,
                userProfileImageUrl,
            }
        });
        res.status(201).json(shapeTestimonialForFrontend(newTestimonial));
    } catch (error) {
        res.status(500).json({ error: 'Failed to create testimonial' });
    }
});

// PUT (update) a testimonial - admin only
router.put('/:id', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    const { title, contentText, visibility } = req.body;
    
    try {
        const updatedTestimonial = await prisma.testimonial.update({
            where: { id },
            data: {
                title,
                contentText,
                visibility: visibility as testimonial_visibility,
                updatedAt: new Date(),
            }
        });
        res.json(shapeTestimonialForFrontend(updatedTestimonial));
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        res.status(500).json({ error: 'Failed to update testimonial' });
    }
});

// DELETE a testimonial - admin only
router.delete('/:id', authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res)) return;
    const { id } = req.params;
    try {
        await prisma.testimonial.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});

export default router;
