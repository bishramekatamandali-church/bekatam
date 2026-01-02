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
const router = express_1.default.Router();
const ensureAdmin = (req, res) => {
    const user = req.user;
    if (!user || user.role !== 'admin') {
        res.status(403).json({ error: 'Only administrators can perform this action.' });
        return false;
    }
    return true;
};
const shapeTestimonialForFrontend = (testimonial) => ({
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
        const testimonials = await db_1.prisma.testimonial.findMany({
            orderBy: { submittedAt: 'desc' },
        });
        res.json(testimonials.map(shapeTestimonialForFrontend));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch testimonials" });
    }
});
// POST a new testimonial (admin only)
router.post('/', auth_1.authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const { title, contentText, visibility, mediaUrls, location, taggedFriends, feelingActivity, backgroundTheme, postedByOwnerId, postedByOwnerName, userId, userName, userProfileImageUrl } = req.body;
    try {
        const newTestimonial = await db_1.prisma.testimonial.create({
            data: {
                id: crypto_1.default.randomUUID(), // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                title,
                contentText,
                visibility: visibility,
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
    const { title, contentText, visibility } = req.body;
    try {
        const updatedTestimonial = await db_1.prisma.testimonial.update({
            where: { id },
            data: {
                title,
                contentText,
                visibility: visibility,
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
    try {
        await db_1.prisma.testimonial.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Testimonial not found.' });
        }
        res.status(500).json({ error: 'Failed to delete testimonial' });
    }
});
exports.default = router;
