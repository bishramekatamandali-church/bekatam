import { Router } from "express";
import {
  getTestPdf,
  getMeetingPdf,
  getDecisionPdf,
  getCollectionRecordPdf,
  getHistoryChapterPdf,
  getChurchMemberPdf,
  getFinancialSummaryPdf,
  getCalendarPdf,
  getFellowshipSchedulePdf,
  getDonorListPdf,
} from "../controllers/pdfController";

const router = Router();

router.get("/test", getTestPdf);
router.get("/meetings/:id", getMeetingPdf);
router.get("/decisions/:id", getDecisionPdf);
router.get("/collection-records/:id", getCollectionRecordPdf);
router.get("/history-chapters/:id", getHistoryChapterPdf);
router.get("/church-members/:id", getChurchMemberPdf);
router.get("/financial-summary", getFinancialSummaryPdf);
router.get("/calendar", getCalendarPdf);
router.get("/fellowship/schedule/:id", getFellowshipSchedulePdf);
router.get("/donor-lists", getDonorListPdf);

export default router;
