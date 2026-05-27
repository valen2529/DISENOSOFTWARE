import { describe, it, expect } from 'vitest';
import { generarSiguienteId } from '../../src/utils/idGenerator.js';

// ──────────────────────────────────────────────
//  PRUEBAS UNITARIAS — Generación de ID empresarial
//  Verifica: RF-44 — ID único por rol
// ──────────────────────────────────────────────

describe('generarSiguienteId — directora', () => {
  it('genera 11.00.001.001 cuando no hay directoras registradas', () => {
    expect(generarSiguienteId('directora', [])).toBe('11.00.001.001');
  });

  it('genera 11.00.002.001 cuando ya existe la directora 001', () => {
    const ids = ['11.00.001.001'];
    expect(generarSiguienteId('directora', ids)).toBe('11.00.002.001');
  });

  it('salta un número ya ocupado y elige el siguiente libre', () => {
    const ids = ['11.00.001.001', '11.00.002.001'];
    expect(generarSiguienteId('directora', ids)).toBe('11.00.003.001');
  });
});

describe('generarSiguienteId — jefe', () => {
  it('genera 11.00.001.222 cuando no hay jefes registrados', () => {
    expect(generarSiguienteId('jefe', [])).toBe('11.00.001.222');
  });

  it('no colisiona con el ID de la directora (sufijo diferente)', () => {
    const ids = ['11.00.001.001'];
    expect(generarSiguienteId('jefe', ids)).toBe('11.00.001.222');
  });

  it('incrementa correctamente cuando ya hay dos jefes', () => {
    const ids = ['11.00.001.222', '11.00.002.222'];
    expect(generarSiguienteId('jefe', ids)).toBe('11.00.003.222');
  });
});

describe('generarSiguienteId — miembro', () => {
  it('genera 11.00.101.333 cuando no hay miembros registrados', () => {
    expect(generarSiguienteId('miembro', [])).toBe('11.00.101.333');
  });

  it('genera 11.00.102.333 cuando ya existe el miembro 101', () => {
    const ids = ['11.00.101.333'];
    expect(generarSiguienteId('miembro', ids)).toBe('11.00.102.333');
  });

  it('ignora IDs de otros roles al calcular el siguiente número', () => {
    const ids = ['11.00.001.001', '11.00.001.222', '11.00.101.333'];
    expect(generarSiguienteId('miembro', ids)).toBe('11.00.102.333');
  });
});

describe('generarSiguienteId — errores', () => {
  it('lanza error si el rol no es reconocido', () => {
    expect(() => generarSiguienteId('admin', [])).toThrow('Rol no reconocido: admin');
  });

  it('lanza error si el rol está vacío', () => {
    expect(() => generarSiguienteId('', [])).toThrow();
  });
});
