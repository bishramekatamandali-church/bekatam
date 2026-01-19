import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { fallbackPayloads, resolveFallbackResource } from "../middleware/fallbackMiddleware";

const prismaConnectionErrorCodes = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1009",
  "P1010",
  "P1011",
  "P1012",
  "P1013",
  "P2021",
  "P2022",
]);

export const isDatabaseUnavailableError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
if (error instanceof Prisma.PrismaClientRustPanicError) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    prismaConnectionErrorCodes.has(error.code)
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return true;
  }

  if (error instanceof Error) {
    return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|Connection terminated/i.test(error.message);
  }

  return false;
};
const sendFallbackResponse = (req: Request, res: Response): void => {
  const resource = resolveFallbackResource(req);
  if (resource && resource in fallbackPayloads) {
    res.status(200).json(fallbackPayloads[resource]);
    return;
  }

  res.status(503).json({
    error: "Database unavailable and no fallback data for this endpoint.",
  });
};

export const handleDatabaseFallback = (
  req: Request,
  res: Response,
  error: unknown
): boolean => {
  if (!isDatabaseUnavailableError(error)) {
    return false;
  }

  sendFallbackResponse(req, res);
  return true;
};
