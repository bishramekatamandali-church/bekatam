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
const shapePrayerRequestForFrontend = (item) => {
    const { comment, prayer, ...rest } = item;
    const comments = Array.isArray(comment) ? comment.map((c) => ({
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
    comments.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    const prayers = Array.isArray(prayer)
        ? prayer.map((p) => ({
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
    };
};
// GET all prayer requests
router.get('/', async (req, res) => {
    try {
        const requests = await db_1.prisma.prayerrequest.findMany({
            include: {
                comment: true,
                prayer: true,
            },
            orderBy: { submittedAt: 'desc' },
        });
        res.json(requests.map(shapePrayerRequestForFrontend));
    }
    catch (error) {
        if ((0, databaseFallback_1.handleDatabaseFallback)(req, res, error)) {
            return;
        }
        res.status(500).json({ error: "Failed to fetch prayer requests" });
    }
});
// POST a new prayer request (admin only)
router.post('/', auth_1.authMiddleware, async (req, res) => {
    if (!ensureAdmin(req, res))
        return;
    const { title, requestText, visibility, category, mediaUrls, location, postedByAdminId, postedByAdminName, userProfileImageUrl, userName, userId } = req.body;
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
                postedByAdminId,
                postedByAdminName,
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
            ? await db_1.prisma.prayer.findUnique({
                where: {
                    userId_prayerRequestId: {
                        userId,
                        prayerRequestId,
                    },
                },
            })
            : await db_1.prisma.prayer.findFirst({
                where: {
                    prayerRequestId,
                    ...(guestEmail ? { guestEmail } : {}),
                    ...(guestPhone ? { guestPhone } : {}),
                },
            });
        if (!existingPrayer) {
            await db_1.prisma.prayer.create({
                data: {
                    id: crypto_1.default.randomUUID(),
                    userId: isLoggedIn ? userId : null,
                    userName: isLoggedIn ? userName : 'Guest',
                    guestEmail: isGuest ? (guestEmail || null) : null,
                    guestPhone: isGuest ? (guestPhone || null) : null,
                    isGuest,
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
            include: {
                comment: true,
                prayer: true,
            },
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
