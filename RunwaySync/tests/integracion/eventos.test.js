import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ──────────────────────────────────────────────
//  PRUEBAS DE INTEGRACIÓN — API de Eventos
//  Verifica: RF-24, RF-25, RF-26, RF-27
// ──────────────────────────────────────────────

vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    connect: vi.fn().mockResolvedValue(true),
    default: { ...actual.default, connect: vi.fn().mockResolvedValue(true) },
  };
});

const idDirectora  = '64a0000000000000000000aa';
const idJefe       = '64a0000000000000000000bb';
const idMiembro    = '64a0000000000000000000cc';
const idEvento     = '64a0000000000000000000ee';

const directora = { _id: idDirectora, nombre: 'Valentina López', rol: 'directora',  id_empresarial: '11.00.001.001' };
const jefe      = { _id: idJefe,      nombre: 'Carlos Ruiz',     rol: 'jefe',       id_empresarial: '11.00.001.222' };
const miembro   = { _id: idMiembro,   nombre: 'Ana Torres',      rol: 'miembro',    id_empresarial: '11.00.101.333' };

const eventoMock = {
  _id: { toString: () => idEvento },
  titulo: 'Fitting FW26',
  tipo: 'fitting',
  fecha: new Date('2026-08-10'),
  horaInicio: '10:00', horaFin: '14:00',
  lugar: 'Atelier Central',
  descripcion: 'Prueba de prendas FW26',
  estado: 'confirmado',
  tags: ['FW26'],
  equipo: [],
  coleccion: 'FW26',
};

vi.mock('../../src/models/User.model.js',       () => ({ default: { findOne: vi.fn(), findById: vi.fn(), find: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0), create: vi.fn() } }));
vi.mock('../../src/models/Event.model.js',      () => ({ default: { find: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0), create: vi.fn(), findByIdAndUpdate: vi.fn(), findByIdAndDelete: vi.fn() } }));
vi.mock('../../src/models/Project.model.js',    () => ({ default: { find: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0), create: vi.fn(), findByIdAndUpdate: vi.fn(), findByIdAndDelete: vi.fn() } }));
vi.mock('../../src/models/Collection.model.js', () => ({ default: { find: vi.fn().mockResolvedValue([]), countDocuments: vi.fn().mockResolvedValue(0), create: vi.fn(), findByIdAndUpdate: vi.fn(), findByIdAndDelete: vi.fn() } }));
vi.mock('bcryptjs',  () => ({ default: { compare: vi.fn().mockResolvedValue(true), hash: vi.fn().mockResolvedValue('hashed') } }));
vi.mock('twilio',    () => ({ default: vi.fn(() => ({ messages: { create: vi.fn() } })) }));

// ── Helper: obtiene cookie de sesión autenticada ──
async function loginComo(app, usuario) {
  const { default: User }     = await import('../../src/models/User.model.js');
  const { default: bcryptjs } = await import('bcryptjs');
  vi.mocked(User.findOne).mockResolvedValue(usuario);
  vi.mocked(bcryptjs.compare).mockResolvedValue(true);

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

// ── RF-24/25: Crear evento ─────────────────────
describe('POST /api/eventos — RF-24, RF-25', () => {
  it('directora puede crear evento con datos completos', async () => {
    const { default: User }  = await import('../../src/models/User.model.js');
    const { default: Event } = await import('../../src/models/Event.model.js');

    vi.mocked(User.findById).mockResolvedValue(directora);
    vi.mocked(Event.create).mockResolvedValue({ ...eventoMock, _id: { toString: () => idEvento } });

    const cookies = await loginComo(app, directora);

    const res = await request(app)
      .post('/api/eventos')
      .set('Cookie', cookies)
      .send({ titulo: 'Fitting FW26', tipo: 'fitting', fecha: '2026-08-10', horaInicio: '10:00', horaFin: '14:00', lugar: 'Atelier Central', estado: 'confirmado', coleccion: 'FW26', tags: ['FW26'] });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('falla si no se envía título', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(directora);

    const cookies = await loginComo(app, directora);

    const res = await request(app)
      .post('/api/eventos')
      .set('Cookie', cookies)
      .send({ fecha: '2026-08-10', tipo: 'fitting' });

    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBeTruthy();
  });

  it('miembro no puede crear evento (RF-24: solo directora/jefe)', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(miembro);

    const cookies = await loginComo(app, miembro);

    const res = await request(app)
      .post('/api/eventos')
      .set('Cookie', cookies)
      .send({ titulo: 'Evento test', fecha: '2026-08-10' });

    expect([200, 403]).toContain(res.status);
    expect(res.body.ok).toBe(false);
  });

  it('jefe puede crear evento', async () => {
    const { default: User }  = await import('../../src/models/User.model.js');
    const { default: Event } = await import('../../src/models/Event.model.js');
    vi.mocked(User.findById).mockResolvedValue(jefe);
    vi.mocked(Event.create).mockResolvedValue(eventoMock);

    const cookies = await loginComo(app, jefe);

    const res = await request(app)
      .post('/api/eventos')
      .set('Cookie', cookies)
      .send({ titulo: 'Casting SS26', fecha: '2026-09-01', tipo: 'casting' });

    expect(res.body.ok).toBe(true);
  });
});

// ── RF-26: Editar evento ───────────────────────
describe('PUT /api/eventos/:id — RF-26', () => {
  it('directora puede editar un evento existente', async () => {
    const { default: User }  = await import('../../src/models/User.model.js');
    const { default: Event } = await import('../../src/models/Event.model.js');
    vi.mocked(User.findById).mockResolvedValue(directora);
    vi.mocked(Event.findByIdAndUpdate).mockResolvedValue({ ...eventoMock, estado: 'confirmado' });

    const cookies = await loginComo(app, directora);

    const res = await request(app)
      .put(`/api/eventos/${idEvento}`)
      .set('Cookie', cookies)
      .send({ estado: 'confirmado' });

    expect(res.body.ok).toBe(true);
  });

  it('miembro no puede editar evento', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(miembro);

    const cookies = await loginComo(app, miembro);

    const res = await request(app)
      .put(`/api/eventos/${idEvento}`)
      .set('Cookie', cookies)
      .send({ estado: 'confirmado' });

    expect([200, 403]).toContain(res.status);
    expect(res.body.ok).toBe(false);
  });
});

// ── RF-27: Eliminar evento ─────────────────────
describe('DELETE /api/eventos/:id — RF-27', () => {
  it('directora puede eliminar un evento', async () => {
    const { default: User }  = await import('../../src/models/User.model.js');
    const { default: Event } = await import('../../src/models/Event.model.js');
    vi.mocked(User.findById).mockResolvedValue(directora);
    vi.mocked(Event.findByIdAndDelete).mockResolvedValue(eventoMock);

    const cookies = await loginComo(app, directora);

    const res = await request(app)
      .delete(`/api/eventos/${idEvento}`)
      .set('Cookie', cookies);

    expect(res.body.ok).toBe(true);
  });

  it('jefe no puede eliminar evento', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(jefe);

    const cookies = await loginComo(app, jefe);

    const res = await request(app)
      .delete(`/api/eventos/${idEvento}`)
      .set('Cookie', cookies);

    expect(res.body.ok).toBe(false);
  });
});
