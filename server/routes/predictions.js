import express from 'express';
import { predictionController } from '../controllers/predictionController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/', asyncWrapper((req, res) => predictionController.getAll(req, res)));
router.post('/', asyncWrapper((req, res) => predictionController.create(req, res)));

export default router;
