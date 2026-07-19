import express from 'express';
import { feedbackController } from '../controllers/feedbackController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/stats', asyncWrapper((req, res) => feedbackController.getStats(req, res)));
router.get('/', asyncWrapper((req, res) => feedbackController.getAll(req, res)));
router.post('/', asyncWrapper((req, res) => feedbackController.create(req, res)));

export default router;
