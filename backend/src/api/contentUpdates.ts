import express from "express";
import { addContentUpdateListener, removeContentUpdateListener } from "../services/contentUpdates";

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // IMPORTANT: because you use compression() globally,
  // flush headers right away if available
  (res as any).flushHeaders?.();

  // Send something immediately so the client/devtools sees bytes
  res.write(`: connected ${new Date().toISOString()}\n\n`);
  res.write(`data: ${JSON.stringify({ type: "connected", ts: Date.now() })}\n\n`);

  const sendUpdate = (payload: unknown) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  addContentUpdateListener(sendUpdate);

  // Heartbeat keeps proxies from closing "idle" SSE
  const heartbeat = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`);
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeContentUpdateListener(sendUpdate);
    res.end();
  });
});

export default router;
