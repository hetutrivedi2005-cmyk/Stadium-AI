import express from 'express';
import { stadiumController } from '../controllers/stadiumController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/', asyncWrapper((req, res) => stadiumController.getAll(req, res)));
router.get('/sid/:stadiumId', asyncWrapper((req, res) => stadiumController.getByStadiumId(req, res)));
router.post('/', asyncWrapper((req, res) => stadiumController.create(req, res)));
router.put('/:id', asyncWrapper((req, res) => stadiumController.update(req, res)));
router.delete('/:id', asyncWrapper((req, res) => stadiumController.remove(req, res)));

export default router;
