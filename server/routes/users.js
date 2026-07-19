import express from 'express';
import { userController } from '../controllers/userController.js';
import asyncWrapper from '../middleware/asyncWrapper.js';

const router = express.Router();

router.get('/', asyncWrapper((req, res) => userController.getAll(req, res)));
router.get('/uid/:uid', asyncWrapper((req, res) => userController.getByUid(req, res)));
router.get('/:id', asyncWrapper((req, res) => userController.getById(req, res)));
router.post('/', asyncWrapper((req, res) => userController.create(req, res)));
router.put('/:id', asyncWrapper((req, res) => userController.update(req, res)));
router.delete('/:id', asyncWrapper((req, res) => userController.remove(req, res)));

export default router;
