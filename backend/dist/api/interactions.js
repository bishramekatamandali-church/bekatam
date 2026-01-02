"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// POST /api/interactions/toggle-like/:itemType/:itemId
router.post('/toggle-like/:itemType/:itemId', async (req, res) => {
    const { itemType, itemId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'
    if (!['like', 'unlike'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action specified.' });
    }
    const prismaModelMap = {
        sermon: db_1.prisma.sermon,
        event: db_1.prisma.eventitem,
        blogPost: db_1.prisma.blogpost,
        news: db_1.prisma.newsitem,
        historyChapter: db_1.prisma.historychapter,
    };
    const model = prismaModelMap[itemType];
    if (!model) {
        return res.status(400).json({ error: 'Invalid item type specified.' });
    }
    try {
        const updatedItem = await model.update({
            where: { id: itemId },
            data: {
                likes: {
                    [action === 'like' ? 'increment' : 'decrement']: 1,
                },
            },
        });
        // Ensure likes don't go below zero
        if (updatedItem.likes < 0) {
            await model.update({
                where: { id: itemId },
                data: { likes: 0 }
            });
            updatedItem.likes = 0;
        }
        res.json(updatedItem);
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: `Item of type ${itemType} with ID ${itemId} not found.` });
        }
        console.error(`Error toggling like for ${itemType} ${itemId}:`, error);
        res.status(500).json({ error: 'Failed to update like count.' });
    }
});
exports.default = router;
