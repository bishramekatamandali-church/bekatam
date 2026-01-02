"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = void 0;
const db_1 = require("../db");
const authorizeAdmin = async (req, res, next) => {
    if (!req.user?.id)
        return res.status(401).json({ error: "Unauthorized" });
    const user = await db_1.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== "admin") {
        return res.status(403).json({ error: "Admin privileges required" });
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
