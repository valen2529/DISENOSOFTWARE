import twilio from 'twilio';
import bcryptjs from 'bcryptjs';
import * as authRepo from '../repositories/auth.repository.js';
import { validatePasswords } from '../validators/auth.validator.js';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const processSendCode = async (telefono) => {
  if (!telefono || telefono.length < 10) {
    return { ok: false, error: 'Número de celular inválido.' };
  }

  const user = await authRepo.findUserByTelefono(telefono);
  if (!user) {
    return { ok: false, error: 'No encontramos un usuario con ese número.' };
  }

  const code    = Math.floor(1000 + Math.random() * 9000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await authRepo.saveResetCode(user, code, expires);

  await client.messages.create({
    body: `Tu PIN de RunwaySync es: ${code}. Válido por 10 minutos.`,
    from: process.env.TWILIO_PHONE,
    to:   `+57${telefono}`,
  });

  return { ok: true };
};

export const processVerifyCode = async (telefono, digits) => {
  const code = digits.join('');
  const user = await authRepo.findUserByTelefono(telefono);

  if (!user || user.resetCode !== code) {
    return { ok: false, error: 'PIN incorrecto.' };
  }
  if (user.resetCodeExpires < Date.now()) {
    return { ok: false, error: 'El PIN ha expirado. Solicita uno nuevo.' };
  }
  return { ok: true };
};

export const processResetPassword = async (telefono, password, confirmPassword) => {
  const validationError = validatePasswords(password, confirmPassword);
  if (validationError) {
    return { ok: false, error: validationError };
  }
  const user           = await authRepo.findUserByTelefono(telefono);
  const hashedPassword = await bcryptjs.hash(password, 10);
  await authRepo.updatePassword(user, hashedPassword);
  return { ok: true };
};