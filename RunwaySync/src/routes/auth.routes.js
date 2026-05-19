import { Router } from "express";
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.get('/recuperar',        authController.showForgotPassword);
router.post('/recuperar',       authController.sendCode);
router.get('/verificar-codigo', authController.showVerifyCode);
router.post('/verificar-codigo',authController.verifyCode);
router.get('/nueva-contrasena', authController.showNewPassword);
router.post('/nueva-contrasena',authController.resetPassword);
router.get('/confirmacion',     authController.showSuccess);

export default router;