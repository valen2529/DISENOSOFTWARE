import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ──────────────────────────────────────────────
//  PRUEBAS DE SISTEMA — Verificación de Requisitos Funcionales
//  Cubre: RF-01 a RF-45
// ──────────────────────────────────────────────

vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    connect: vi.fn().mockResolvedValue(true),
    default: { ...actual.default, connect: vi.fn().mockResolvedValue(true) },
  };
});

// ── Datos de prueba del sistema ───────────────
const DIRECTORA = { _id: '64b0000000000000000000aa', nombre: 'Valentina López', rol: 'directora', id_empresarial: '11.00.001.001' };
const JEFE      = { _id: '64b0000000000000000000bb', nombre: 'Carlos Ruiz',     rol: 'jefe',      id_empresarial: '11.00.001.222', area: 'styling' };
const MIEMBRO   = { _id: '64b0000000000000000000cc', nombre: 'Ana Torres',      rol: 'miembro',   id_empresarial: '11.00.101.333', area: 'fotografia' };

const EVENTO_DOC = {
  _id: { toString: () => '64b0000000000000000000ee' },
  titulo: 'Casting SS27', tipo: 'casting',
  fecha: new Date('2026-09-15'), horaInicio: '09:00', horaFin: '13:00',
  lugar: 'Estudio Norte', descripcion: 'Casting de modelos SS27',
  estado: 'confirmado', tags: ['SS27', 'Casting'], equipo: [], coleccion: 'SS27',
};

const PROYECTO_DOC = {
  _id: { toString: () => '64b0000000000000000000ff' },
  nombre: 'Lookbook FW26', sub: 'Fotografía editorial', estado: 'activo',
  progreso: 60, fechaEntrega: new Date('2026-10-01'), equipo: [],
  color: '#cd1b80', colorBg: 'rgba(205,27,128,0.18)',
};

const COLECCION_DOC = {
  _id: { toString: () => '64b000000000000000000011' },
  nombre: 'SS27 · Spring Summer', temporada: 'SS27',
  descripcion: 'Colección PV 2027', estado: 'En diseño', progreso: 15,
  prendas: [], swatches: [], tags: [],
};

vi.mock('../../src/models/User.model.js',       () => ({ default: { findOne: vi.fn(), findById: vi.fn(), find: vi.fn().mockResolvedValue([DIRECTORA, JEFE, MIEMBRO]), countDocuments: vi.fn().mockResolvedValue(3), create: vi.fn() } }));
vi.mock('../../src/models/Event.model.js',      () => ({ default: { find: vi.fn().mockResolvedValue([EVENTO_DOC]), countDocuments: vi.fn().mockResolvedValue(1), create: vi.fn(), findByIdAndUpdate: vi.fn(), findByIdAndDelete: vi.fn() } }));
vi.mock('../../src/models/Project.model.js',    () => ({ default: { find: vi.fn().mockResolvedValue([PROYECTO_DOC]), countDocuments: vi.fn().mockResolvedValue(1), create: vi.fn(), findByIdAndUpdate: vi.fn(), findByIdAndDelete: vi.fn() } }));
vi.mock('../../src/models/Collection.model.js', () => ({ default: { find: vi.fn().mockResolvedValue([COLECCION_DOC]), countDocuments: vi.fn().mockResolvedValue(1), create: vi.fn(), findByIdAndUpdate: vi.fn(), findByIdAndDelete: vi.fn() } }));
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn().mockResolvedValue(true), hash: vi.fn().mockResolvedValue('$hashed') } }));
vi.mock('twilio',   () => ({ default: vi.fn(() => ({ messages: { create: vi.fn() } })) }));

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

// ═══════════════════════════════════════════════
//  RF-AUTH — Autenticación
// ═══════════════════════════════════════════════

describe('[RF-01] El sistema permite iniciar sesión con ID y contraseña válidos', () => {
  it('responde con redirección al dashboard tras login exitoso', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findOne).mockResolvedValue(DIRECTORA);
    const res = await request(app).post('/login').send('id_empresarial=11.00.001.001&password=test').set('Content-Type', 'application/x-www-form-urlencoded');
    expect([200, 302]).toContain(res.status);
  });
});

describe('[RF-02] El sistema muestra error con credenciales incorrectas', () => {
  it('devuelve status 200 con mensaje de error (no redirige)', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findOne).mockResolvedValue(null);
    const res = await request(app).post('/login').send('id_empresarial=00.00.000.000&password=mal').set('Content-Type', 'application/x-www-form-urlencoded');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/incorrecto|inválido|error/i);
  });
});

describe('[RF-03] El sistema cierra sesión y redirige al login', () => {
  it('GET /logout devuelve redirección', async () => {
    const res = await request(app).get('/logout');
    expect(res.status).toBe(302);
  });
});

describe('[RF-07] Las rutas privadas requieren sesión activa', () => {
  it('GET /dashboard sin sesión redirige al login', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(302);
  });
  it('GET /eventos sin sesión redirige al login', async () => {
    expect((await request(app).get('/eventos')).status).toBe(302);
  });
  it('GET /colecciones sin sesión redirige al login', async () => {
    expect((await request(app).get('/colecciones')).status).toBe(302);
  });
  it('GET /proyectos sin sesión redirige al login', async () => {
    expect((await request(app).get('/proyectos')).status).toBe(302);
  });
  it('GET /equipo sin sesión redirige al login', async () => {
    expect((await request(app).get('/equipo')).status).toBe(302);
  });
});

// ═══════════════════════════════════════════════
//  RF-DASH — Dashboard
// ═══════════════════════════════════════════════

describe('[RF-08 a RF-13] Dashboard carga correctamente con sesión activa', () => {
  it('GET /dashboard devuelve 200 con sesión de directora', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/dashboard').set('Cookie', cookies);
    expect(res.status).toBe(200);
  });

  it('La respuesta del dashboard contiene la palabra "Dashboard"', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/dashboard').set('Cookie', cookies);
    expect(res.text).toMatch(/dashboard/i);
  });
});

// ═══════════════════════════════════════════════
//  RF-CAL — Calendario
// ═══════════════════════════════════════════════

describe('[RF-15 a RF-20] Calendario carga y es solo lectura', () => {
  it('GET /calendario devuelve 200 con sesión activa', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/calendario').set('Cookie', cookies);
    expect(res.status).toBe(200);
  });

  it('[RF-20] El calendario no tiene formulario de creación de eventos', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/calendario').set('Cookie', cookies);
    expect(res.text).not.toMatch(/openNuevoEvento|handleCellClick/);
  });
});

// ═══════════════════════════════════════════════
//  RF-EV — Eventos
// ═══════════════════════════════════════════════

describe('[RF-21] Eventos muestra todos los eventos de la BD', () => {
  it('GET /eventos devuelve 200', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/eventos').set('Cookie', cookies);
    expect(res.status).toBe(200);
  });
});

describe('[RF-24] Solo directora/jefe pueden crear eventos', () => {
  it('Miembro recibe ok:false al intentar crear evento', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(MIEMBRO);
    const cookies = await loginComo(app, MIEMBRO);
    const res = await request(app).post('/api/eventos').set('Cookie', cookies).send({ titulo: 'Test', fecha: '2026-09-01' });
    expect(res.body.ok).toBe(false);
  });
});

describe('[RF-25] Evento creado se guarda en la BD', () => {
  it('POST /api/eventos retorna ok:true con datos válidos', async () => {
    const { default: User }  = await import('../../src/models/User.model.js');
    const { default: Event } = await import('../../src/models/Event.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    vi.mocked(Event.create).mockResolvedValue(EVENTO_DOC);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).post('/api/eventos').set('Cookie', cookies).send({ titulo: 'Casting SS27', fecha: '2026-09-15', tipo: 'casting' });
    expect(res.body.ok).toBe(true);
    expect(Event.create).toHaveBeenCalled();
  });
});

describe('[RF-27] Solo directora puede eliminar eventos', () => {
  it('Jefe recibe ok:false al intentar eliminar', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(JEFE);
    const cookies = await loginComo(app, JEFE);
    const res = await request(app).delete('/api/eventos/64b0000000000000000000ee').set('Cookie', cookies);
    expect(res.body.ok).toBe(false);
  });

  it('Directora puede eliminar evento', async () => {
    const { default: User }  = await import('../../src/models/User.model.js');
    const { default: Event } = await import('../../src/models/Event.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    vi.mocked(Event.findByIdAndDelete).mockResolvedValue(EVENTO_DOC);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).delete('/api/eventos/64b0000000000000000000ee').set('Cookie', cookies);
    expect(res.body.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════
//  RF-COL — Colecciones
// ═══════════════════════════════════════════════

describe('[RF-31/32] Sección colecciones carga con datos de BD', () => {
  it('GET /colecciones devuelve 200', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/colecciones').set('Cookie', cookies);
    expect(res.status).toBe(200);
  });
});

describe('[RF-33/34] Crear colección', () => {
  it('Directora crea colección con nombre válido', async () => {
    const { default: User }       = await import('../../src/models/User.model.js');
    const { default: Collection } = await import('../../src/models/Collection.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    vi.mocked(Collection.create).mockResolvedValue(COLECCION_DOC);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).post('/api/colecciones').set('Cookie', cookies).send({ nombre: 'SS27', temporada: 'SS27' });
    expect(res.body.ok).toBe(true);
  });

  it('Falla si nombre está vacío', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).post('/api/colecciones').set('Cookie', cookies).send({ nombre: '' });
    expect(res.body.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════
//  RF-PROY — Proyectos
// ═══════════════════════════════════════════════

describe('[RF-37] Proyectos carga con datos de BD', () => {
  it('GET /proyectos devuelve 200', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/proyectos').set('Cookie', cookies);
    expect(res.status).toBe(200);
  });
});

describe('[RF-38/39] Crear proyecto', () => {
  it('Directora crea proyecto con nombre válido', async () => {
    const { default: User }    = await import('../../src/models/User.model.js');
    const { default: Project } = await import('../../src/models/Project.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    vi.mocked(Project.create).mockResolvedValue(PROYECTO_DOC);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).post('/api/proyectos').set('Cookie', cookies).send({ nombre: 'Lookbook FW26', estado: 'activo' });
    expect(res.body.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════
//  RF-EQ — Equipo
// ═══════════════════════════════════════════════

describe('[RF-42] Sección equipo carga lista de miembros', () => {
  it('GET /equipo devuelve 200', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/equipo').set('Cookie', cookies);
    expect(res.status).toBe(200);
  });
});

describe('[RF-43] Solo directora puede agregar miembros', () => {
  it('Miembro recibe ok:false al intentar invitar', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(MIEMBRO);
    const cookies = await loginComo(app, MIEMBRO);
    const res = await request(app).post('/invitar-miembro').set('Cookie', cookies).send({ nombre: 'Test', id_empresarial: '11.00.102.333', telefono: '3001234567', rol: 'miembro', password: 'secret123' });
    expect(res.body.ok).toBe(false);
  });
});

describe('[RF-44] ID empresarial generado es único por rol', () => {
  it('GET /generar-id?rol=directora devuelve ID con sufijo 001', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    vi.mocked(User.find).mockResolvedValue([{ id_empresarial: '11.00.001.001' }]);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/generar-id?rol=directora').set('Cookie', cookies);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toMatch(/\.001$/);
    expect(res.body.id).not.toBe('11.00.001.001');
  });

  it('GET /generar-id?rol=miembro devuelve ID con sufijo 333', async () => {
    const { default: User } = await import('../../src/models/User.model.js');
    vi.mocked(User.findById).mockResolvedValue(DIRECTORA);
    vi.mocked(User.find).mockResolvedValue([]);
    const cookies = await loginComo(app, DIRECTORA);
    const res = await request(app).get('/generar-id?rol=miembro').set('Cookie', cookies);
    expect(res.body.id).toMatch(/\.333$/);
  });
});
