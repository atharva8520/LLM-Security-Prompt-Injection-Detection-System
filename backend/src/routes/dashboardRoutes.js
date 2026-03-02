import express from 'express';
import { getDashboardSummary, getDashboardTimeline, getDashboardRecent } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/timeline', getDashboardTimeline);
router.get('/recent', getDashboardRecent);

export default router;
