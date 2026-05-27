import * as authService from '../service/auth.service.js';

export const showForgotPassword = (req, res) => {
  res.render('recuperar', { error: null });
};

export const sendCode = async (req, res) => {
  const { telefono } = req.body;
  const result = await authService.processSendCode(telefono);

  if (!result.ok) {
    return res.render('recuperar', { error: result.error });
  }

  req.session.resetTelefono = telefono;
  res.redirect('/verificar-codigo');
};

export const showVerifyCode = (req, res) => {
  if (!req.session.resetTelefono) return res.redirect('/recuperar');
  res.render('verificar-codigo', { error: null });
};

export const verifyCode = async (req, res) => {
  const digits = [req.body.digit1, req.body.digit2, req.body.digit3, req.body.digit4];
  const result = await authService.processVerifyCode(req.session.resetTelefono, digits);

  if (!result.ok) {
    return res.render('verificar-codigo', { error: result.error });
  }

  req.session.codeVerified = true;
  res.redirect('/nueva-contrasena');
};

export const showNewPassword = (req, res) => {
  if (!req.session.codeVerified) return res.redirect('/recuperar');
  res.render('nueva-contrasena', { error: null });
};

export const resetPassword = async (req, res) => {
  console.log('➡️ resetPassword desde CONTROLLER');
  const { password, confirmar } = req.body;

  const result = await authService.processResetPassword(
    req.session.resetTelefono, password, confirmar
  );

  if (!result.ok) {
    return res.render('nueva-contrasena', { error: result.error });
  }

  req.session.resetTelefono = null;
  req.session.codeVerified  = null;
  res.redirect('/confirmacion');
};

export const showSuccess = (req, res) => {
  res.render('confirmacion');
};