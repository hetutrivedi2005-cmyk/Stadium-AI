import express from 'express';
import { weatherCacheController } from '../controllers/weatherCacheController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/', asyncWrapper((req, res) => weatherCacheController.getAll(req, res)));
router.get('/latest/:stadium', asyncWrapper((req, res) => weatherCacheController.getLatest(req, res)));
router.post('/', asyncWrapper((req, res) => weatherCacheController.create(req, res)));

export default router;
