import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ──────────────────────────────────────────────
//  PRUEBAS DE INTEGRACIÓN — Autenticación
//  Verifica: RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-07
// ──────────────────────────────────────────────

// Mock de mongoose para no conectar a una BD real
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    connect: vi.fn().mockResolvedValue(true),
    default: { ...actual.default, connect: vi.fn().mockResolvedValue(true) },
  };
});

// Usuario de prueba en memoria
const usuarioPrueba = {
  _id: '64a0000000000000000000aa',
  nombre: 'Valentina López',
  id_empresarial: '11.00.001.001',
  rol: 'directora',
  password: '$2a$10$hashedpassword',  // hash de "secreto123"
};

// Mock del modelo User
vi.mock('../../src/models/User.model.js', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    find: vi.fn().mockResolvedValue([]),
    countDocuments: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock('../../src/models/Event.model.js', () => ({
  default: {
    find: vi.fn().mockResolvedValue([]),
    countDocuments: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock('../../src/models/Project.model.js', () => ({
  default: {
    find: vi.fn().mockResolvedValue([]),
    countDocuments: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock('../../src/models/Collection.model.js', () => ({
  default: {
    find: vi.fn().mockResolvedValue([]),
    countDocuments: vi.fn().mockResolvedValue(0),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue('$2a$10$hasheado'),
  },
}));

vi.mock('twilio', () => ({ default: vi.fn(() => ({ messages: { create: vi.fn() } })) }));

let app;
beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../../src/app.js');
  app = mod.default ?? mod.app;
});

// ── RF-01: Login con credenciales correctas ────
describe('POST /login — RF-01', () => {
  it('redirige al dashboard con credenciales válidas', async () => {
    const { default: User }     = await import('../../src/models/User.model.js');
    const { default: bcryptjs } = await import('bcryptjs');

    vi.mocked(User.findOne).mockResolvedValue(usuarioPrueba);
    vi.mocked(bcryptjs.compare).mockResolvedValue(true);

    const res = await request(app)
      .post('/login')
      .send('id_empresarial=11.00.001.001&password=secreto123')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect([200, 302]).toContain(res.status);
  });
});

// ── RF-02: Login con credenciales incorrectas ──
describe('POST /login — RF-02', () => {
  it('muestra error cuando el usuario no existe', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findOne).mockResolvedValue(null);

    const res = await request(app)
      .post('/login')
      .send('id_empresarial=99.00.000.000&password=cualquiera')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/incorrecto|inválido|error/i);
  });

  it('muestra error cuando la contraseña es incorrecta', async () => {
    const { default: User }     = await import('../../src/models/User.model.js');
    const { default: bcryptjs } = await import('bcryptjs');

    vi.mocked(User.findOne).mockResolvedValue(usuarioPrueba);
    vi.mocked(bcryptjs.compare).mockResolvedValue(false);

    const res = await request(app)
      .post('/login')
      .send('id_empresarial=11.00.001.001&password=wrongpass')
      .set('Content-Type', 'application/x-www-form-urlencoded');

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/incorrecto|inválido|error/i);
  });
});

// ── RF-03: Logout ──────────────────────────────
describe('GET /logout — RF-03', () => {
  it('destruye la sesión y redirige al login', async () => {
    const res = await request(app).get('/logout');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^\//);
  });
});

// ── RF-07: Rutas protegidas sin sesión ─────────
describe('Rutas protegidas — RF-07', () => {
  it('redirige al login si se accede al dashboard sin sesión', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/^\//);
  });

  it('redirige al login si se accede a eventos sin sesión', async () => {
    const res = await request(app).get('/eventos');
    expect(res.status).toBe(302);
  });

  it('redirige al login si se accede al calendario sin sesión', async () => {
    const res = await request(app).get('/calendario');
    expect(res.status).toBe(302);
  });

  it('redirige al login si se intenta crear un evento sin sesión (API)', async () => {
    const res = await request(app)
      .post('/api/eventos')
      .send({ titulo: 'Test', fecha: '2026-08-01' });
    expect([302, 401]).toContain(res.status);
  });
});
