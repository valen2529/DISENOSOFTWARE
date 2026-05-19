import nodemailer from 'nodemailer';
import bcryptjs from 'bcryptjs';
import * as authRepo from '../repositories/auth.repository.js';
import { validateEmail, validatePasswords } from '../validators/auth.validator.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'saraletradoco@gmail.com',     // 👈 tu correo Gmail
    pass: 'umyaebawnyhmnfyi',   // 👈 reemplaza con los 16 caracteres
  },
});

export const processSendCode = async (email) => {
  if (!validateEmail(email)) {
    return { ok: false, error: 'Correo electrónico inválido.' };
  }
  const user = await authRepo.findUserByEmail(email);
  if (!user) {
    return { ok: false, error: 'No existe una cuenta con ese correo.' };
  }

  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await authRepo.saveResetCode(user, code, expires);

  await transporter.sendMail({
    from: '"RunwaySync" <saraletradoco@gmail.com>',  // 👈 tu correo Gmail
    to: email,
    subject: 'Código de verificación - RunwaySync',
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Tu código de verificación es:</p>
      <h1 style="letter-spacing:8px">${code}</h1>
      <p>Expira en 10 minutos.</p>
    `,
  });

  return { ok: true };
};

export const processVerifyCode = async (email, digits) => {
  const code = digits.join('');
  const user = await authRepo.findUserByEmail(email);

  if (!user || user.resetCode !== code) {
    return { ok: false, error: 'Código incorrecto.' };
  }
  if (user.resetCodeExpires < Date.now()) {
    return { ok: false, error: 'El código ha expirado. Solicita uno nuevo.' };
  }
  return { ok: true };
};

export const processResetPassword = async (email, password, confirmPassword) => {
  const validationError = validatePasswords(password, confirmPassword);
  if (validationError) {
    return { ok: false, error: validationError };
  }
  const user = await authRepo.findUserByEmail(email);
  const hashedPassword = await bcryptjs.hash(password, 10);
  await authRepo.updatePassword(user, hashedPassword);
  return { ok: true };
};