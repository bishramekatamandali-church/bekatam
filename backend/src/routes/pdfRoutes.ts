import { Router } from "express";
import { getTestPdf, getMeetingPdf, getDecisionPdf, getCollectionRecordPdf } from "../controllers/pdfController";

const router = Router();

router.get("/test", getTestPdf);
router.get("/meetings/:id", getMeetingPdf);
router.get("/decisions/:id", getDecisionPdf);
router.get("/collection-records/:id", getCollectionRecordPdf);

export default router;
