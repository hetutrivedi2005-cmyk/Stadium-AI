import express from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/summary', asyncWrapper((req, res) => dashboardController.getSummary(req, res)));

export default router;
