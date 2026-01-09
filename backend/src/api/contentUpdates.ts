import express from 'express';
import { addContentUpdateListener, removeContentUpdateListener } from '../services/contentUpdates';

const router = express.Router();

router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendUpdate = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  addContentUpdateListener(sendUpdate);

  req.on('close', () => {
    removeContentUpdateListener(sendUpdate);
  });
});

export default router;
