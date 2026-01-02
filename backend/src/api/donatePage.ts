import express from 'express';
import { prisma } from '../db';

const router = express.Router();
const SINGLETON_ID = 'singleton';

// Get donate page content
router.get('/', async (_req, res) => {
  try {
    const content = await prisma.donatepagecontent.findUnique({ where: { id: SINGLETON_ID } });
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load donate page content.' });
  }
});

// Upsert donate page content
router.put('/', async (req, res) => {
  const data = req.body;

  try {
    const updated = await prisma.donatepagecontent.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        ...data,
        updatedAt: new Date(),
      },
      update: {
        ...data,
        updatedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save donate page content.' });
  }
});

export default router;
