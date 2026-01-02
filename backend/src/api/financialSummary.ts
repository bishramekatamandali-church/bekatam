import express from 'express';
import { prisma } from '../db';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [donations, collections, expenses] = await Promise.all([
      prisma.donationrecord.aggregate({ _sum: { amount: true } }),
      prisma.collectionrecord.aggregate({ _sum: { amount: true } }),
      prisma.expenserecord.aggregate({ _sum: { amount: true } }),
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to build financial summary.' });
  }
});

export default router;
