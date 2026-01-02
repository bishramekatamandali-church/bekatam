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
const shapePrayerRequestForFrontend = (pr) => {
    const { _count, ...rest } = pr;
    return {
        ...rest,
        comments: [], // Comments handled separately
        linkPath: `/prayer-requests#prayer-${pr.id}`,
        submittedAt: new Date(pr.submittedAt).toISOString(),
        lastPrayedAt: pr.lastPrayedAt ? new Date(pr.lastPrayedAt).toISOString() : null,
        createdAt: pr.createdAt ? new Date(pr.createdAt).toISOString() : null,
        updatedAt: pr.updatedAt ? new Date(pr.updatedAt).toISOString() : null,
        mediaUrls: pr.mediaUrls || [],
        // The frontend `Prayer` type has userName, but the DB `Prayer` model doesn't store it.
        // The frontend will have to rely on a userMap or we join the user table here.
        // For simplicity now, we send what we have. Frontend can adapt.
        prayers: pr.prayers || [],
    };
};
// GET all prayer requests
router.get('/', async (req, res) => {
    try {
        const requests = await db_1.prisma.prayerrequest.findMany({
            orderBy: { submittedAt: 'desc' },
            include: { prayer: true }
        });
        res.json(requests.map(shapePrayerRequestForFrontend));
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch prayer requests" });
    }
});
// POST a new prayer request (admin only)
router.post('/', auth_1.authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const { title, requestText, visibility, category, mediaUrls, location, taggedFriends, feelingActivity, backgroundTheme, postedByOwnerId, postedByOwnerName, userProfileImageUrl, userName, userId } = req.body;
    try {
        const newRequest = await db_1.prisma.prayerrequest.create({
            data: {
                id: crypto_1.default.randomUUID(), // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                title,
                requestText,
                visibility: visibility,
                category,
                status: 'active',
                mediaUrls: mediaUrls || undefined,
                location,
                taggedFriends,
                feelingActivity,
                backgroundTheme,
                postedByOwnerId,
                postedByOwnerName,
                userProfileImageUrl,
                userName,
                userId,
            }
        });
        res.status(201).json(shapePrayerRequestForFrontend(newRequest));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create prayer request' });
    }
});
// PUT (update) status of a prayer request (admin only)
router.put('/:id/status', auth_1.authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    if (!Object.values(client_1.prayerrequest_status).includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided.' });
    }
    try {
        const updatedRequest = await db_1.prisma.prayerrequest.update({
            where: { id },
            data: {
                status: status,
                adminNotes: adminNotes || undefined,
                updatedAt: new Date(),
            },
            include: { prayer: true }
        });
        res.json(shapePrayerRequestForFrontend(updatedRequest));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
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
        const existingPrayer = await db_1.prisma.prayer.findUnique({
            where: {
                userId_prayerRequestId: {
                    userId,
                    prayerRequestId,
                },
            },
        });
        if (existingPrayer) {
            // User has already prayed, so we "un-pray" by deleting the record
            await db_1.prisma.prayer.delete({ where: { id: existingPrayer.id } });
        }
        else {
            // User has not prayed, so we create a new prayer record
            await db_1.prisma.prayer.create({
                data: {
                    id: crypto_1.default.randomUUID(), // REQUIRED in your schema
                    userId,
                    userName, // Storing userName for convenience, though it could be denormalized
                    prayerRequestId,
                },
            });
        }
        // Update the lastPrayedAt timestamp on the parent request
        await db_1.prisma.prayerrequest.update({
            where: { id: prayerRequestId },
            data: { lastPrayedAt: new Date() }
        });
        // Fetch the updated prayer request with the new prayer list
        const updatedRequest = await db_1.prisma.prayerrequest.findUnique({
            where: { id: prayerRequestId },
            include: { prayer: true },
        });
        if (!updatedRequest) {
            return res.status(404).json({ error: "Prayer request not found after toggling prayer." });
        }
        res.json(shapePrayerRequestForFrontend(updatedRequest));
    }
    catch (error) {
        console.error(`Error toggling prayer for request ${prayerRequestId}:`, error);
        res.status(500).json({ error: 'Failed to toggle prayer.' });
    }
});
// DELETE a prayer request (admin only)
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const { id } = req.params;
    try {
        // Prisma's onDelete: Cascade will handle deleting related comments and prayers
        await db_1.prisma.prayerrequest.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Prayer request not found.' });
        }
        res.status(500).json({ error: 'Failed to delete prayer request' });
    }
});
exports.default = router;
