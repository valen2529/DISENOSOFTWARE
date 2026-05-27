/**
 * Genera el siguiente ID empresarial único para un rol dado.
 * @param {string} rol - 'directora' | 'jefe' | 'miembro'
 * @param {string[]} idsExistentes - Array de todos los id_empresarial ya registrados en la BD
 * @returns {string} Nuevo ID con formato 11.00.NNN.SUFIJO
 */
export function generarSiguienteId(rol, idsExistentes = []) {
  const sufijos = { directora: '001', jefe: '222', miembro: '333' };
  const sufijo = sufijos[rol];
  if (!sufijo) throw new Error(`Rol no reconocido: ${rol}`);

  const numerosUsados = new Set(
    idsExistentes
      .filter(id => id && id.endsWith('.' + sufijo))
      .map(id => parseInt(id.split('.')[2], 10))
      .filter(n => !isNaN(n))
  );

  let num = rol === 'miembro' ? 101 : 1;
  while (numerosUsados.has(num)) num++;

  return `11.00.${String(num).padStart(3, '0')}.${sufijo}`;
}

/**
 * Valida los campos obligatorios de un nuevo evento.
 * @returns {{ ok: boolean, error?: string }}
 */
export function validarEvento({ titulo, fecha, tipo }) {
  if (!titulo || titulo.trim() === '') return { ok: false, error: 'El título es obligatorio.' };
  if (!fecha) return { ok: false, error: 'La fecha es obligatoria.' };
  const tiposValidos = ['casting', 'editorial', 'fitting', 'reunion'];
  if (tipo && !tiposValidos.includes(tipo)) return { ok: false, error: `Tipo inválido: ${tipo}` };
  return { ok: true };
}

/**
 * Valida los campos obligatorios de un nuevo miembro.
 * @returns {{ ok: boolean, error?: string }}
 */
export function validarMiembro({ nombre, id_empresarial, telefono, rol, password }) {
  if (!nombre || nombre.trim() === '')        return { ok: false, error: 'El nombre es obligatorio.' };
  if (!id_empresarial)                         return { ok: false, error: 'El ID empresarial es obligatorio.' };
  if (!telefono)                               return { ok: false, error: 'El teléfono es obligatorio.' };
  if (!rol)                                    return { ok: false, error: 'El rol es obligatorio.' };
  if (!password || password.length < 6)        return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  return { ok: true };
}

/**
 * Valida los campos obligatorios de una nueva colección.
 * @returns {{ ok: boolean, error?: string }}
 */
export function validarColeccion({ nombre }) {
  if (!nombre || nombre.trim() === '') return { ok: false, error: 'El nombre de la colección es obligatorio.' };
  return { ok: true };
}
