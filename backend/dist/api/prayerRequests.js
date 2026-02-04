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
        moderatedAt: rest.moderatedAt ? new Date(rest.moderatedAt).toISOString() : null,
    };
};
// GET all prayer requests
router.get('/', async (req, res) => {
    try {
        const requests = await db_1.prisma.prayerrequest.findMany({
            where: { isDeleted: false },
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
// POST a new prayer request (all registered users)
router.post('/', auth_1.authMiddleware, async (req, res) => {
    const requestUser = req.user;
    if (!requestUser?.id) {
        return res.status(401).json({ error: 'Authentication required to submit a prayer request.' });
    }
    const { title, requestText, visibility, category, mediaUrls, location } = req.body;
    const trimmedTitle = String(title || '').trim();
    const trimmedRequestText = String(requestText || '').trim();
    const hasMedia = Array.isArray(mediaUrls) && mediaUrls.length > 0;
    if (!trimmedRequestText && !hasMedia) {
        return res.status(400).json({ error: 'Prayer request text or media is required.' });
    }
    const resolvedVisibility = Object.values(client_1.prayerrequest_visibility).includes(visibility)
        ? visibility
        : client_1.prayerrequest_visibility.public;
    const resolvedCategory = Object.values(client_1.prayerrequest_category).includes(category)
        ? category
        : client_1.prayerrequest_category.Other;
    try {
        const user = await db_1.prisma.user.findUnique({ where: { id: requestUser.id } });
        if (!user) {
            return res.status(401).json({ error: 'User account not found.' });
        }
        const isAdmin = requestUser.role === 'admin';
        const newRequest = await db_1.prisma.prayerrequest.create({
            data: {
                id: crypto_1.default.randomUUID(), // REQUIRED in your schema
                updatedAt: new Date(), // REQUIRED
                title: trimmedTitle || trimmedRequestText.split(' ').slice(0, 7).join(' ') || 'Prayer Request',
                requestText: trimmedRequestText,
                visibility: resolvedVisibility,
                category: resolvedCategory,
                status: 'active',
                mediaUrls: mediaUrls || undefined,
                location,
                postedByAdminId: isAdmin ? requestUser.id : undefined,
                postedByAdminName: isAdmin ? requestUser.fullName : undefined,
                userProfileImageUrl: user.profileImageUrl || undefined,
                userName: user.fullName,
                userId: user.id,
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
    const { status, adminNotes, moderationReason } = req.body;
    if (!Object.values(client_1.prayerrequest_status).includes(status)) {
        return res.status(400).json({ error: 'Invalid status provided.' });
    }
    if (!moderationReason || !String(moderationReason).trim()) {
        return res.status(400).json({ error: 'A public reason is required for status updates.' });
    }
    try {
        const adminUser = req.user;
        const updatedRequest = await db_1.prisma.prayerrequest.update({
            where: { id },
            data: {
                status: status,
                adminNotes: adminNotes || undefined,
                moderationReason: String(moderationReason).trim(),
                moderatedAt: new Date(),
                moderatedByAdminId: adminUser?.id,
                moderatedByAdminName: adminUser?.fullName,
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
    const { reason } = req.body || {};
    if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'A public reason is required to delete a prayer request.' });
    }
    try {
        const adminUser = req.user;
        const updated = await db_1.prisma.prayerrequest.update({
            where: { id },
            data: {
                isDeleted: true,
                moderationReason: String(reason).trim(),
                moderatedAt: new Date(),
                moderatedByAdminId: adminUser?.id,
                moderatedByAdminName: adminUser?.fullName,
                updatedAt: new Date(),
            },
            include: { prayer: true }
        });
        res.json(shapePrayerRequestForFrontend(updated));
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Prayer request not found.' });
        }
        res.status(500).json({ error: 'Failed to delete prayer request' });
    }
});
exports.default = router;
