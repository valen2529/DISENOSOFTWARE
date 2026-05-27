import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ──────────────────────────────────────────────
//  PRUEBAS DE INTEGRACIÓN — API de Colecciones
//  Verifica: RF-33, RF-34, RF-36
// ──────────────────────────────────────────────

vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    connect: vi.fn().mockResolvedValue(true),
    default: { ...actual.default, connect: vi.fn().mockResolvedValue(true) },
  };
});

const idDirectora = '64a0000000000000000000aa';
const idMiembro   = '64a0000000000000000000cc';
const idColeccion = '64a0000000000000000000ff';

const directora = { _id: idDirectora, nombre: 'Valentina López', rol: 'directora', id_empresarial: '11.00.001.001' };
const miembro   = { _id: idMiembro,   nombre: 'Ana Torres',      rol: 'miembro',  id_empresarial: '11.00.101.333' };

const coleccionMock = {
  _id: { toString: () => idColeccion },
  nombre: 'SS27 · Spring Summer',
  temporada: 'SS27',
  descripcion: 'Colección primavera verano 2027',
  estado: 'En diseño',
  progreso: 0,
  prendas: [],
  swatches: [],
  tags: [],
};

vi.mock('../../src/models/User.model.js',       () => ({ default: { findOne: vi.fn(), findById: vi.fn(), find: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0), create: vi.fn() } }));
vi.mock('../../src/models/Event.model.js',      () => ({ default: { find: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0) } }));
vi.mock('../../src/models/Project.model.js',    () => ({ default: { find: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0) } }));
vi.mock('../../src/models/Collection.model.js', () => ({ default: { find: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0), create: vi.fn(), findByIdAndUpdate: vi.fn(), findByIdAndDelete: vi.fn() } }));
vi.mock('bcryptjs',  () => ({ default: { compare: vi.fn().mockResolvedValue(true), hash: vi.fn().mockResolvedValue('hashed') } }));
vi.mock('twilio',    () => ({ default: vi.fn(() => ({ messages: { create: vi.fn() } })) }));

async function loginComo(app, usuario) {
  const { default: User } = await import('../../src/models/User.model.js');
  vi.mocked(User.findOne).mockResolvedValue(usuario);
  const res = await request(app)
    .post('/login')
    .send(`id_empresarial=${usuario.id_empresarial}&password=test`)
    .set('Content-Type', 'application/x-www-form-urlencoded');
  return res.headers['set-cookie'];
}

let app;
beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../../src/app.js');
  app = mod.default ?? mod.app;
});

// ── RF-33/34: Crear colección ──────────────────
describe('POST /api/colecciones — RF-33, RF-34', () => {
  it('directora puede crear una colección con datos completos', async () => {
    const { default: User }       = await import('../../src/models/User.model.js');
    const { default: Collection } = await import('../../src/models/Collection.model.js');
    vi.mocked(User.findById).mockResolvedValue(directora);
    vi.mocked(Collection.create).mockResolvedValue(coleccionMock);

    const cookies = await loginComo(app, directora);

    const res = await request(app)
      .post('/api/colecciones')
      .set('Cookie', cookies)
      .send({ nombre: 'SS27 · Spring Summer', temporada: 'SS27', descripcion: 'Colección PV 2027', estado: 'En diseño' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('falla si el nombre está vacío', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(directora);

    const cookies = await loginComo(app, directora);

    const res = await request(app)
      .post('/api/colecciones')
      .set('Cookie', cookies)
      .send({ nombre: '', temporada: 'SS27' });

    expect(res.body.ok).toBe(false);
  });

  it('miembro no puede crear colección', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(miembro);

    const cookies = await loginComo(app, miembro);

    const res = await request(app)
      .post('/api/colecciones')
      .set('Cookie', cookies)
      .send({ nombre: 'Colección test', temporada: 'SS27' });

    expect(res.body.ok).toBe(false);
  });

  it('retorna la colección creada en la respuesta', async () => {
    const { default: User }       = await import('../../src/models/User.model.js');
    const { default: Collection } = await import('../../src/models/Collection.model.js');
    vi.mocked(User.findById).mockResolvedValue(directora);
    vi.mocked(Collection.create).mockResolvedValue(coleccionMock);

    const cookies = await loginComo(app, directora);

    const res = await request(app)
      .post('/api/colecciones')
      .set('Cookie', cookies)
      .send({ nombre: 'SS27 · Spring Summer', temporada: 'SS27' });

    expect(res.body.coleccion).toBeDefined();
  });
});

// ── RF-36: Eliminar colección ──────────────────
describe('DELETE /api/colecciones/:id — RF-36', () => {
  it('directora puede eliminar una colección existente', async () => {
    const { default: User }       = await import('../../src/models/User.model.js');
    const { default: Collection } = await import('../../src/models/Collection.model.js');
    vi.mocked(User.findById).mockResolvedValue(directora);
    vi.mocked(Collection.findByIdAndDelete).mockResolvedValue(coleccionMock);

    const cookies = await loginComo(app, directora);

    const res = await request(app)
      .delete(`/api/colecciones/${idColeccion}`)
      .set('Cookie', cookies);

    expect(res.body.ok).toBe(true);
  });

  it('miembro no puede eliminar colección', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(miembro);

    const cookies = await loginComo(app, miembro);

    const res = await request(app)
      .delete(`/api/colecciones/${idColeccion}`)
      .set('Cookie', cookies);

    expect(res.body.ok).toBe(false);
  });
});
