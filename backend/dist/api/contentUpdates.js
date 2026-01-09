"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contentUpdates_1 = require("../services/contentUpdates");
const router = express_1.default.Router();
router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const sendUpdate = (payload) => {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    (0, contentUpdates_1.addContentUpdateListener)(sendUpdate);
    req.on('close', () => {
        (0, contentUpdates_1.removeContentUpdateListener)(sendUpdate);
    });
});
exports.default = router;
