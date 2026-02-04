"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const databaseFallback_1 = require("../utils/databaseFallback");
const router = express_1.default.Router();
const ensureAdmin = (req, res) => {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Only administrators can perform this action.' });
        return false;
    }
    return true;
};
const shapeTestimonialForFrontend = (item) => {
    const { comment, ...rest } = item;
    const comments = Array.isArray(comment) ? comment.map((c) => ({
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
    comments.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
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
        const testimonials = await db_1.prisma.testimonial.findMany({
            where: { isDeleted: false },
            include: { comment: true },
            orderBy: { submittedAt: 'desc' },
        });
        res.json(testimonials.map(shapeTestimonialForFrontend));
    }
    catch (error) {
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Failed to fetch testimonials" });
    }
});
// POST a new testimonial (all registered users)
router.post('/', auth_1.authMiddleware, async (req, res) => {
    const requestUser = req.user;
    if (!requestUser?.id) {
        return res.status(401).json({ error: 'Authentication required to submit a testimonial.' });
    }
    const { title, contentText, visibility, mediaUrls, location } = req.body;
    const trimmedTitle = String(title || '').trim();
    const trimmedContentText = String(contentText || '').trim();
    const hasMedia = Array.isArray(mediaUrls) && mediaUrls.length > 0;
    if (!trimmedTitle) {
        return res.status(400).json({ error: 'A title is required to submit a testimonial.' });
    }
    if (!trimmedContentText && !hasMedia) {
        return res.status(400).json({ error: 'Testimonial text or media is required.' });
    }
    const resolvedVisibility = Object.values(client_1.testimonial_visibility).includes(visibility)
        ? visibility
        : client_1.testimonial_visibility.public;
    try {
        const user = await db_1.prisma.user.findUnique({ where: { id: requestUser.id } });
        if (!user) {
            return res.status(401).json({ error: 'User account not found.' });
        }
        const isAdmin = requestUser.role === 'admin';
        const newTestimonial = await db_1.prisma.testimonial.create({
            data: {
                id: crypto_1.default.randomUUID(), // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                title: trimmedTitle,
                contentText: trimmedContentText,
                visibility: resolvedVisibility,
                mediaUrls: mediaUrls || undefined,
                location,
                postedByAdminId: isAdmin ? requestUser.id : undefined,
                postedByAdminName: isAdmin ? requestUser.fullName : undefined,
                userId: user.id,
                userName: user.fullName,
                userProfileImageUrl: user.profileImageUrl || undefined,
            }
        });
        res.status(201).json(shapeTestimonialForFrontend(newTestimonial));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create testimonial' });
    }
});
// PUT (update) a testimonial - admin only
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const { id } = req.params;
    const { title, contentText, visibility, moderationReason } = req.body;
    if (!moderationReason || !String(moderationReason).trim()) {
        return res.status(400).json({ error: 'A public reason is required for testimonial edits.' });
    }
    try {
        const adminUser = req.user;
        const updatedTestimonial = await db_1.prisma.testimonial.update({
            where: { id },
            data: {
                title,
                contentText,
                visibility: visibility,
                moderationReason: String(moderationReason).trim(),
                moderatedAt: new Date(),
                moderatedByAdminId: adminUser?.id,
                moderatedByAdminName: adminUser?.fullName,
                updatedAt: new Date(),
            }
        });
        res.json(shapeTestimonialForFrontend(updatedTestimonial));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        res.status(500).json({ error: 'Failed to update testimonial' });
    }
});
// DELETE a testimonial - admin only
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const { id } = req.params;
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'A public reason is required to delete a testimonial.' });
    }
    try {
        const adminUser = req.user;
        const updatedTestimonial = await db_1.prisma.testimonial.update({
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
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});
exports.default = router;
