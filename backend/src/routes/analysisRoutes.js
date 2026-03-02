import express from 'express';
import { analyze, getHistory, getAnalysisById, deleteHistory, getStats } from '../controllers/analysisController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/analyze', analyze);
router.get('/history', getHistory);
router.get('/stats', getStats);
router.get('/history/:id', getAnalysisById);
router.delete('/history/:id', deleteHistory);

export default router;
