"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contentUpdates_1 = require("../services/contentUpdates");
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    // IMPORTANT: because you use compression() globally,
    // flush headers right away if available
    res.flushHeaders?.();
    // Send something immediately so the client/devtools sees bytes
    res.write(`: connected ${new Date().toISOString()}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "connected", ts: Date.now() })}\n\n`);
    const sendUpdate = (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    (0, contentUpdates_1.addContentUpdateListener)(sendUpdate);
    // Heartbeat keeps proxies from closing "idle" SSE
    const heartbeat = setInterval(() => {
        res.write(`: ping ${Date.now()}\n\n`);
    }, 20000);
    req.on("close", () => {
        clearInterval(heartbeat);
        (0, contentUpdates_1.removeContentUpdateListener)(sendUpdate);
        res.end();
    });
});
exports.default = router;
