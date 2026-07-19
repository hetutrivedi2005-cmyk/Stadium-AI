import express from 'express';
import { newsCacheController } from '../controllers/newsCacheController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/', asyncWrapper((req, res) => newsCacheController.getAll(req, res)));
router.post('/bulk', asyncWrapper((req, res) => newsCacheController.bulkCreate(req, res)));

export default router;
