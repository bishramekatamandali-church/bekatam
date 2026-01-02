import { Request, Response, NextFunction } from "express";
import { prisma } from "../db";

type RequestWithUser = Request & { user?: { id: string; role: string } };

export const authorizeAdmin = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return res.status(403).json({ error: "Admin privileges required" });
  }

  next();
};

export const authorizeOwner = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user || user.role !== "owner") {
    return res.status(403).json({ error: "Owner privileges required" });
  }

  next();
};
