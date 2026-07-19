import express from 'express';
import { announcementController } from '../controllers/announcementController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/', asyncWrapper((req, res) => announcementController.getAll(req, res)));
router.get('/:id', asyncWrapper((req, res) => announcementController.getById(req, res)));
router.post('/', asyncWrapper((req, res) => announcementController.create(req, res)));
router.put('/:id', asyncWrapper((req, res) => announcementController.update(req, res)));
router.delete('/:id', asyncWrapper((req, res) => announcementController.remove(req, res)));

export default router;
