import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import crypto from 'crypto';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const expenses = await prisma.expenserecord.findMany({ orderBy: { expenseDate: 'desc' } });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense records.' });
  }
});

router.post('/', async (req, res) => {
  const { expenseDate, category, description, amount, payee, paymentMethod, transactionReference, receiptUrl, approvedBy, notes, source, location, status, postedByOwnerId, postedByOwnerName } = req.body;

  if (!expenseDate || !category || !description || amount === undefined) {
    return res.status(400).json({ error: 'Expense date, category, description, and amount are required.' });
  }

  try {
    const created = await prisma.expenserecord.create({
      data: {
        id: crypto.randomUUID(),
        expenseDate: new Date(expenseDate),
        category,
        description,
        amount: Number(amount),
        payee,
        paymentMethod,
        transactionReference,
        receiptUrl,
        approvedBy,
        notes,
        source,
        location,
        status,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense record.' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { expenseDate, category, description, amount, payee, paymentMethod, transactionReference, receiptUrl, approvedBy, notes, source, location, status, postedByOwnerId, postedByOwnerName } = req.body;

  try {
    const updated = await prisma.expenserecord.update({
      where: { id },
      data: {
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        category,
        description,
        amount: amount !== undefined ? Number(amount) : undefined,
        payee,
        paymentMethod,
        transactionReference,
        receiptUrl,
        approvedBy,
        notes,
        source,
        location,
        status,
        postedByOwnerId,
        postedByOwnerName,
        updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Expense record not found.' });
    }
    res.status(500).json({ error: 'Failed to update expense record.' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.expenserecord.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Expense record not found.' });
    }
    res.status(500).json({ error: 'Failed to delete expense record.' });
  }
});

export default router;
