import express from 'express';
import { aiController } from '../controllers/aiController.js';

const router = express.Router();

router.post('/chat', (req, res) => aiController.chat(req, res));
router.post('/translate-text', (req, res) => aiController.translateText(req, res));
router.post('/incident', (req, res) => aiController.incident(req, res));
router.post('/predict', (req, res) => aiController.predict(req, res));
router.post('/translate', (req, res) => aiController.translate(req, res));

export default router;
