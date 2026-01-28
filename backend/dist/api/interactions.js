"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
router.post('/toggle-like/:itemType/:itemId', async (req, res) => {
    const { itemType, itemId } = req.params;
    const { action, userId, guestName, guestEmail, guestPhone } = req.body;
    if (!['like', 'unlike'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action. Use like/unlike.' });
    }
    // identity rules
    const isLoggedIn = Boolean(userId);
    const isGuest = !isLoggedIn && Boolean(guestEmail || guestPhone);
    if (!isLoggedIn && !isGuest) {
        return res.status(400).json({ error: 'userId OR guestEmail/guestPhone is required.' });
    }
    if (isLoggedIn) {
        const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (user.accountStatus === 'blocked') {
            const blockRequest = await db_1.prisma.useractionrequest.findFirst({
                where: { userId: user.id, actionType: 'block', status: 'approved' },
                orderBy: { createdAt: 'desc' },
                select: { reason: true },
            });
            return res.status(403).json({
                error: 'Your account is blocked from liking content.',
                code: 'ACCOUNT_BLOCKED',
                blockReason: blockRequest?.reason || 'Not specified.',
            });
        }
        if (user.accountStatus === 'deleted') {
            return res.status(403).json({ error: 'Deleted accounts cannot like content.' });
        }
    }
    const likeWhere = {
        itemType,
        itemId,
        userId: isLoggedIn ? userId : null,
        guestEmail: isGuest ? (guestEmail || null) : null,
        guestPhone: isGuest ? (guestPhone || null) : null,
    };
    try {
        if (action === 'like') {
            // prevent duplicates (handle cases where unique constraint may not cover phone-only guests)
            const existing = await db_1.prisma.contentlike.findFirst({ where: likeWhere });
            if (!existing) {
                await db_1.prisma.contentlike.create({
                    data: {
                        itemType,
                        itemId,
                        userId: isLoggedIn ? userId : null,
                        guestName: isGuest ? (guestName || null) : null,
                        guestEmail: isGuest ? (guestEmail || null) : null,
                        guestPhone: isGuest ? (guestPhone || null) : null,
                    },
                });
            }
        }
        else {
            // unlike -> delete if exists
            const existing = await db_1.prisma.contentlike.findFirst({ where: likeWhere });
            if (existing) {
                await db_1.prisma.contentlike.delete({ where: { id: existing.id } });
            }
        }
        // recompute likes from contentlike table (source of truth)
        const likesCount = await db_1.prisma.contentlike.count({
            where: { itemType, itemId },
        });
        // update the target item likes column so existing API responses remain compatible
        const modelMap = {
            sermon: db_1.prisma.sermon,
            event: db_1.prisma.eventitem,
            blogPost: db_1.prisma.blogpost,
            news: db_1.prisma.newsitem,
            historyChapter: db_1.prisma.historychapter,
            prayerRequest: db_1.prisma.prayerrequest,
            testimonial: db_1.prisma.testimonial,
        };
        const model = modelMap[itemType];
        if (!model)
            return res.status(400).json({ error: 'Invalid itemType.' });
        await model.update({
            where: { id: itemId },
            data: { likes: likesCount },
        });
        return res.json({ likes: likesCount });
    }
    catch (err) {
        console.error(`toggle-like error ${itemType}/${itemId}`, err);
        return res.status(500).json({ error: 'Failed to update like.' });
    }
});
exports.default = router;
