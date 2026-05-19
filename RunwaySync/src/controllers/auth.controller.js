import * as authService from '../service/auth.service.js';

// ── Pantalla 1: Formulario de correo ────────────────────────
export const showForgotPassword = (req, res) => {
  res.render('recuperar', { error: null });
};

export const sendCode = async (req, res) => {
  const { email } = req.body;
  const result = await authService.processSendCode(email);

  if (!result.ok) {
    return res.render('recuperar', { error: result.error });
  }

  req.session.resetEmail = email;
  res.redirect('/verificar-codigo');
};

// ── Pantalla 2: Verificar código ────────────────────────────
export const showVerifyCode = (req, res) => {
  if (!req.session.resetEmail) return res.redirect('/recuperar');
  res.render('verificar-codigo', { error: null });
};

export const verifyCode = async (req, res) => {
  const digits = [req.body.digit1, req.body.digit2, req.body.digit3, req.body.digit4];
  const result = await authService.processVerifyCode(req.session.resetEmail, digits);

  if (!result.ok) {
    return res.render('verificar-codigo', { error: result.error });
  }

  req.session.codeVerified = true;
  res.redirect('/nueva-contrasena');
};

// ── Pantalla 3: Nueva contraseña ────────────────────────────
export const showNewPassword = (req, res) => {
  if (!req.session.codeVerified) return res.redirect('/recuperar');
  res.render('nueva-contrasena', { error: null });
};

export const resetPassword = async (req, res) => {
  const { password, confirmPassword } = req.body;

  const result = await authService.processResetPassword(
    req.session.resetEmail, password, confirmPassword
  );

  if (!result.ok) {
    return res.render('nueva-contrasena', { error: result.error });
  }

  req.session.resetEmail = null;
  req.session.codeVerified = null;
  res.redirect('/confirmacion');
};

// ── Pantalla 4: Éxito ───────────────────────────────────────
export const showSuccess = (req, res) => {
  res.render('confirmacion');
};