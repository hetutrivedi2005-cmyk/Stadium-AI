import express from 'express';
import { incidentController } from '../controllers/incidentController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/stats', asyncWrapper((req, res) => incidentController.getStats(req, res)));
router.get('/', asyncWrapper((req, res) => incidentController.getAll(req, res)));
router.get('/:id', asyncWrapper((req, res) => incidentController.getById(req, res)));
router.post('/', asyncWrapper((req, res) => incidentController.create(req, res)));
router.put('/:id', asyncWrapper((req, res) => incidentController.update(req, res)));
router.delete('/:id', asyncWrapper((req, res) => incidentController.remove(req, res)));

export default router;
