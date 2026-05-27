import { describe, it, expect } from 'vitest';
import {
  validarEvento,
  validarMiembro,
  validarColeccion,
} from '../../src/utils/idGenerator.js';

// ──────────────────────────────────────────────
//  PRUEBAS UNITARIAS — Validaciones de entrada
//  Verifica: RF-24, RF-33, RF-43
// ──────────────────────────────────────────────

// ── validarEvento ──────────────────────────────
describe('validarEvento', () => {
  it('retorna ok:true con datos completos y válidos', () => {
    const result = validarEvento({ titulo: 'Fitting FW26', fecha: '2026-08-10', tipo: 'fitting' });
    expect(result.ok).toBe(true);
  });

  it('falla si el título está vacío', () => {
    const result = validarEvento({ titulo: '', fecha: '2026-08-10', tipo: 'fitting' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/título/i);
  });

  it('falla si el título es solo espacios en blanco', () => {
    const result = validarEvento({ titulo: '   ', fecha: '2026-08-10', tipo: 'fitting' });
    expect(result.ok).toBe(false);
  });

  it('falla si la fecha no está presente', () => {
    const result = validarEvento({ titulo: 'Casting SS26', fecha: null, tipo: 'casting' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/fecha/i);
  });

  it('falla si el tipo no es uno de los valores permitidos', () => {
    const result = validarEvento({ titulo: 'Evento X', fecha: '2026-08-10', tipo: 'desfile' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/tipo/i);
  });

  it('acepta tipo undefined (campo opcional)', () => {
    const result = validarEvento({ titulo: 'Evento Y', fecha: '2026-08-10' });
    expect(result.ok).toBe(true);
  });
});

// ── validarMiembro ─────────────────────────────
describe('validarMiembro', () => {
  const base = {
    nombre: 'Ana López',
    id_empresarial: '11.00.101.333',
    telefono: '3001234567',
    rol: 'miembro',
    password: 'segura123',
  };

  it('retorna ok:true con todos los campos correctos', () => {
    expect(validarMiembro(base).ok).toBe(true);
  });

  it('falla si el nombre está vacío', () => {
    expect(validarMiembro({ ...base, nombre: '' }).ok).toBe(false);
  });

  it('falla si el ID empresarial no está presente', () => {
    expect(validarMiembro({ ...base, id_empresarial: '' }).ok).toBe(false);
  });

  it('falla si la contraseña tiene menos de 6 caracteres', () => {
    const result = validarMiembro({ ...base, password: '123' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/contraseña/i);
  });

  it('falla si el rol no está definido', () => {
    expect(validarMiembro({ ...base, rol: '' }).ok).toBe(false);
  });
});

// ── validarColeccion ───────────────────────────
describe('validarColeccion', () => {
  it('retorna ok:true con nombre válido', () => {
    expect(validarColeccion({ nombre: 'SS26 · Spring Summer' }).ok).toBe(true);
  });

  it('falla si el nombre está vacío', () => {
    const result = validarColeccion({ nombre: '' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/nombre/i);
  });

  it('falla si el nombre es solo espacios', () => {
    expect(validarColeccion({ nombre: '   ' }).ok).toBe(false);
  });
});
