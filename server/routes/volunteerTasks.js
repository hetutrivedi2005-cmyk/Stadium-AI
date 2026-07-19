import express from 'express';
import { volunteerTaskController } from '../controllers/volunteerTaskController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/', asyncWrapper((req, res) => volunteerTaskController.getAll(req, res)));
router.get('/:id', asyncWrapper((req, res) => volunteerTaskController.getById(req, res)));
router.post('/', asyncWrapper((req, res) => volunteerTaskController.create(req, res)));
router.put('/:id', asyncWrapper((req, res) => volunteerTaskController.update(req, res)));
router.delete('/:id', asyncWrapper((req, res) => volunteerTaskController.remove(req, res)));

export default router;
