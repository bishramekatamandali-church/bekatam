"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const router = express_1.default.Router();
router.get('/', async (_req, res) => {
    try {
        const [donations, collections, expenses] = await Promise.all([
            db_1.prisma.donationrecord.aggregate({ _sum: { amount: true } }),
            db_1.prisma.collectionrecord.aggregate({ _sum: { amount: true } }),
            db_1.prisma.expenserecord.aggregate({ _sum: { amount: true } }),
        ]);
        const totalDonations = Number(donations._sum.amount ?? 0);
        const totalCollections = Number(collections._sum.amount ?? 0);
        const totalExpenses = Number(expenses._sum.amount ?? 0);
        res.json({
            totals: {
                donations: totalDonations,
                collections: totalCollections,
                expenses: totalExpenses,
                netBalance: totalDonations + totalCollections - totalExpenses,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to build financial summary.' });
    }
});
exports.default = router;
