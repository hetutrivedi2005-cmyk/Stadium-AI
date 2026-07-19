import express from 'express';
import { chatHistoryController } from '../controllers/chatHistoryController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/', asyncWrapper((req, res) => chatHistoryController.getAll(req, res)));
router.post('/', asyncWrapper((req, res) => chatHistoryController.create(req, res)));

export default router;
