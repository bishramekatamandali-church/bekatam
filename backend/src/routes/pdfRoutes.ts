import { Router } from "express";
import { getTestPdf } from "../controllers/pdfController";

const router = Router();
router.get("/test", getTestPdf);

export default router;
