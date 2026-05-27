import { Router } from 'express';
import twilio from 'twilio';
import User       from '../models/User.model.js';
import Event      from '../models/Event.model.js';
import Project    from '../models/Project.model.js';
import Collection from '../models/Collection.model.js';
import bcryptjs from 'bcryptjs';

const router = Router();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/* ══════════════════════════════════════
   CONSTANTS & HELPERS
══════════════════════════════════════ */
const ROL_LABEL = {
  directora: 'Directora Creativa',
  jefe:      'Jefe de Área',
  miembro:   'Miembro de Equipo',
};
const ROL_COLOR = {
  directora:  { color: '#cd1b80', bg: 'rgba(205,27,128,0.18)' },
  fotografia: { color: '#004aad', bg: 'rgba(0,74,173,0.18)'   },
  styling:    { color: '#08b864', bg: 'rgba(8,184,100,0.18)'  },
  produccion: { color: '#b88917', bg: 'rgba(184,137,23,0.18)' },
};
const AREA_COLOR  = ROL_COLOR;
const AREA_SKILLS = {
  fotografia: ['Fotografía','Edición','Iluminación'],
  styling:    ['Styling','Fitting','Tendencias'],
  produccion: ['Producción','Logística','Presupuesto'],
};
const AREA_LABEL = { fotografia:'Fotografía', styling:'Styling', produccion:'Producción' };
const TYPE_COLORS = { casting:'#cd1b80', editorial:'#08b864', fitting:'#b88917', reunion:'#004aad' };
const MES_CORTO   = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MES_CORTO_UP= ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

const SEASON_CFG = {
  'SS26':    { label:'SS26 · Spring / Summer', color:'#cd1b80', colorBg:'rgba(205,27,128,0.12)' },
  'FW26':    { label:'FW26 · Fall / Winter',   color:'#004aad', colorBg:'rgba(0,74,173,0.12)'   },
  'Resort27':{ label:'Resort 27 · Crucero',    color:'#08b864', colorBg:'rgba(8,184,100,0.12)'  },
  'SS27':    { label:'SS27 · Spring / Summer', color:'#7611bd', colorBg:'rgba(118,17,189,0.12)' },
};
const STATUS_CFG = {
  'En producción': { color:'#08b864', bg:'rgba(8,184,100,0.10)'   },
  'En diseño':     { color:'#b88917', bg:'rgba(184,137,23,0.10)'  },
  'Ideación':      { color:'#7611bd', bg:'rgba(118,17,189,0.10)'  },
  'Aprobado':      { color:'#08b864', bg:'rgba(8,184,100,0.10)'   },
};

/* ── User helpers ── */
const getUsuario = (u) => {
  const colorKey = u.rol === 'directora' ? 'directora' : u.area;
  const c = ROL_COLOR[colorKey] || { color: '#6f6f6f', bg: 'rgba(111,111,111,0.15)' };
  const words = u.nombre.trim().split(' ');
  const ini = (words[0][0] + (words[1]?.[0] || words[0][1])).toUpperCase();
  return {
    id:       u._id.toString(),
    ini, nombre: u.nombre,
    rol:      u.rol, area: u.area || null,
    rolLabel: ROL_LABEL[u.rol] || u.rol,
    color: c.color, colorBg: c.bg,
  };
};

function mapMiembro(u) {
  const key    = u.rol === 'directora' ? 'directora' : u.area;
  const c      = AREA_COLOR[key] || { color:'#6f6f6f', bg:'rgba(111,111,111,0.15)' };
  const words  = u.nombre.trim().split(' ');
  const ini    = (words[0][0] + (words[1]?.[0] || words[0][1])).toUpperCase();
  const rolLabel = u.rol === 'directora' ? 'Directora Creativa'
    : u.rol === 'jefe' ? `Jefe de ${AREA_LABEL[u.area] || u.area}`
    : `Miembro · ${AREA_LABEL[u.area] || u.area}`;
  return {
    _id:    u._id.toString(),
    ini, nombre: u.nombre, rolLabel,
    rol: u.rol, area: u.area || null,
    id_empresarial: u.id_empresarial,
    telefono: u.telefono,
    bg: c.bg, color: c.color,
    skills: u.rol === 'directora' ? ['Dirección','Moodboard','Casting'] : (AREA_SKILLS[u.area] || []),
    online: false,
  };
}

/* ── Build MIEMBROS map keyed by ObjectId string ── */
async function buildMIEMBROS() {
  const usuarios = await User.find();
  const map = {};
  usuarios.forEach(u => {
    const key = u.rol === 'directora' ? 'directora' : u.area;
    const c   = ROL_COLOR[key] || { color:'#6f6f6f', bg:'rgba(111,111,111,0.15)' };
    const ws  = u.nombre.trim().split(' ');
    const ini = (ws[0][0] + (ws[1]?.[0] || ws[0][1])).toUpperCase();
    map[u._id.toString()] = { nombre: u.nombre, ini, rol: ROL_LABEL[u.rol] || u.rol, color: c.color, colorBg: c.bg };
  });
  return map;
}

/* ── Get next 4 upcoming events for notifications ── */
async function getNotificaciones() {
  const ahora = new Date(); ahora.setHours(0,0,0,0);
  const evts = await Event.find({ fecha: { $gte: ahora } }).sort({ fecha: 1 }).limit(4);
  return evts.map(e => {
    const d = new Date(e.fecha);
    const meta = `${d.getDate()} ${MES_CORTO_UP[d.getMonth()]} · ${e.horaInicio || ''} · ${e.lugar || ''}`.replace(/\s·\s*$/,'').trim();
    return { color: TYPE_COLORS[e.tipo] || '#cd1b80', nombre: e.titulo, meta };
  });
}

/* ── Map Event doc → template object ── */
function mapEventoDoc(e, rol) {
  const d   = new Date(e.fecha);
  const mes = MES_CORTO_UP[d.getMonth()];
  return {
    id:          e._id.toString(),
    nombre:      e.titulo,
    tipo:        e.tipo,
    dia:         String(d.getDate()).padStart(2,'0'),
    mes,
    lugar:       e.lugar || '',
    hora:        [e.horaInicio, e.horaFin].filter(Boolean).join(' – '),
    descripcion: e.descripcion || '',
    status:      e.estado,
    color:       TYPE_COLORS[e.tipo] || '#cd1b80',
    tags:        e.tags || [],
    team:        (e.equipo || []).map(u => u.toString()),
    dateStr:     d.toISOString().split('T')[0],
    canEdit:     rol !== 'miembro',
    canDelete:   rol === 'directora',
  };
}

/* ── Map Project doc → template object ── */
function mapProyectoDoc(p, rol) {
  const d     = p.fechaEntrega ? new Date(p.fechaEntrega) : null;
  const now   = new Date();
  const overdue = d && d < now && p.estado !== 'completado';
  const ws    = p.nombre.trim().split(' ');
  const ini   = p.initials || (ws[0][0] + (ws[1]?.[0] || ws[0][1])).toUpperCase();
  return {
    id:           p._id.toString(),
    name:         p.nombre,
    sub:          p.sub || '',
    initials:     ini,
    color:        p.color || '#cd1b80',
    colorBg:      p.colorBg || 'rgba(205,27,128,0.18)',
    collection:   p.coleccion || '',
    progress:     p.progreso || 0,
    delivery:     d ? `${d.getDate()} ${MES_CORTO[d.getMonth()]}` : '',
    deliveryDate: d ? d.toISOString().split('T')[0] : '',
    status:       p.estado,
    overdue,
    team:         (p.equipo || []).map(u => u.toString()),
    canEdit:      rol !== 'miembro',
    canDelete:    rol === 'directora',
  };
}

/* ── Map Collection doc → template object ── */
function mapColeccionDoc(c) {
  const sc = SEASON_CFG[c.temporada] || { label: c.temporada || '', color:'#6f6f6f', colorBg:'rgba(111,111,111,0.12)' };
  const st = STATUS_CFG[c.estado]   || { color:'#6f6f6f', bg:'rgba(111,111,111,0.10)' };
  return {
    id:          c._id.toString(),
    season:      sc.label,
    name:        c.nombre,
    desc:        c.descripcion || '',
    img:         c.imagen || '',
    progress:    c.progreso || 0,
    color:       c.color || sc.color,
    colorBg:     c.colorBg || sc.colorBg,
    status:      c.estado || '',
    statusColor: st.color,
    statusBg:    st.bg,
    tags:        c.tags || [],
    swatches:    c.swatches || [],
    prendas:     (c.prendas || []).map(p => ({
      id:       p._id ? p._id.toString() : '',
      nombre:   p.nombre   || '',
      categoria:p.categoria|| '',
      img:      p.img      || '',
      desc:     p.desc     || '',
      material: p.material || '',
      color:    p.color    || '',
      talla:    p.talla    || '',
      estado:   p.estado   || '',
      swatches: p.swatches || [],
    })),
  };
}

/* ══════════════════════════════════════
   AUTH ROUTES
══════════════════════════════════════ */
router.get('/', (req, res) => res.render('index.ejs', { error: null }));
router.get('/login', (req, res) => res.redirect('/'));

router.post('/login', async (req, res) => {
  const { id_empresarial, password } = req.body;
  try {
    const usuario = await User.findOne({ id_empresarial });
    if (!usuario) return res.render('index.ejs', { error: 'Usuario no encontrado.' });
    const coincide = await bcryptjs.compare(password, usuario.password);
    if (!coincide) return res.render('index.ejs', { error: 'Contraseña incorrecta.' });
    req.session.userId  = usuario._id;
    req.session.userRol = usuario.rol;
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('index.ejs', { error: 'Error al iniciar sesión.' });
  }
});

/* ══════════════════════════════════════
   PAGE ROUTES
══════════════════════════════════════ */

// ── GET /dashboard ──
router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const u = await User.findById(req.session.userId);
    if (!u) return res.redirect('/');
    const notificaciones = await getNotificaciones();
    const now = new Date();

    const [proyActivos, totalCol, totalEvPrx, totalCastings] = await Promise.all([
      Project.countDocuments({ estado: { $in: ['activo','revision'] } }),
      Collection.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ tipo: 'casting' }),
    ]);

    const proyDocList = await Project.find().sort({ updatedAt: -1 }).limit(5);
    const proyectos   = proyDocList.map(p => mapProyectoDoc(p, u.rol));

    const evDocs  = await Event.find({}).sort({ fecha: -1 }).limit(50);
    const eventosJS = evDocs.map(e => ({
      date:      new Date(e.fecha).toISOString().split('T')[0],
      type:      e.tipo,
      title:     e.titulo,
      startTime: e.horaInicio || '',
      location:  e.lugar || '',
    }));

    const stats = { proyectos: proyActivos, colecciones: totalCol, eventos: totalEvPrx, castings: totalCastings };
    res.render('dashboard.ejs', { usuario: getUsuario(u), notificaciones, stats, proyectos, eventosJS });
  } catch (err) {
    console.error(err); res.redirect('/');
  }
});

// ── GET /calendario ──
router.get('/calendario', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const u = await User.findById(req.session.userId);
    const notificaciones = await getNotificaciones();
    const MIEMBROS = await buildMIEMBROS();
    const evDocs = await Event.find().sort({ fecha: 1 });
    const eventosJS = evDocs.map(e => ({
      id:          e._id.toString(),
      title:       e.titulo,
      type:        e.tipo,
      date:        new Date(e.fecha).toISOString().split('T')[0],
      startTime:   e.horaInicio || '',
      endTime:     e.horaFin   || '',
      location:    e.lugar     || '',
      description: e.descripcion || '',
      collection:  e.coleccion || '',
      models:      [],
      notes:       '',
      attendees:   (e.equipo || []).map(id => id.toString()),
      agenda:      [],
    }));
    res.render('calendario.ejs', { usuario: getUsuario(u), eventosJS, MIEMBROS, notificaciones });
  } catch (err) {
    console.error(err); res.redirect('/dashboard');
  }
});

// ── GET /colecciones ──
router.get('/colecciones', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const u = await User.findById(req.session.userId);
    const notificaciones = await getNotificaciones();
    const docs = await Collection.find().sort({ createdAt: -1 });
    const colecciones = docs.map(mapColeccionDoc);
    const coleccionesMap = {};
    colecciones.forEach(c => { coleccionesMap[c.id] = c; });
    res.render('colecciones.ejs', { usuario: getUsuario(u), colecciones, coleccionesMap, notificaciones });
  } catch (err) {
    console.error(err); res.redirect('/dashboard');
  }
});

// ── GET /eventos ──
router.get('/eventos', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const u = await User.findById(req.session.userId);
    const rol = u.rol;
    const notificaciones = await getNotificaciones();
    const MIEMBROS = await buildMIEMBROS();

    const evDocs = await Event.find({}).sort({ fecha: -1 });
    const eventos = evDocs.map(e => mapEventoDoc(e, rol));

    const resumen = {
      total:        eventos.length,
      confirmados:  eventos.filter(e => e.status === 'confirmado').length,
      pendientes:   eventos.filter(e => e.status === 'pendiente').length,
      porConfirmar: eventos.filter(e => e.status === 'por_confirmar').length,
    };

    const PROXIMOS_MAYO = eventos.slice(0, 3).map(e => ({
      nombre: e.nombre,
      fecha:  `${parseInt(e.dia)} ${MES_CORTO[new Date(e.dateStr + 'T12:00:00').getMonth()]}`,
      lugar:  e.lugar,
      color:  e.color,
    }));

    const todosU  = await User.find().sort({ rol: 1, area: 1 });
    const miembros = todosU.map(mapMiembro);

    res.render('eventos.ejs', {
      usuario: { ...getUsuario(u), rol },
      eventos, MIEMBROS, miembros, resumen, PROXIMOS_MAYO, notificaciones,
    });
  } catch (err) {
    console.error(err); res.redirect('/dashboard');
  }
});

// ── GET /proyectos ──
router.get('/proyectos', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const u = await User.findById(req.session.userId);
    const rol = u.rol;
    const notificaciones = await getNotificaciones();
    const MIEMBROS = await buildMIEMBROS();

    const pDocs    = await Project.find().sort({ createdAt: -1 });
    const proyectos = pDocs.map(p => mapProyectoDoc(p, rol));

    const stats = {
      total:       proyectos.length,
      activos:     proyectos.filter(p => p.status === 'activo').length,
      revision:    proyectos.filter(p => p.status === 'revision').length,
      completados: proyectos.filter(p => p.status === 'completado').length,
      avance:      proyectos.length
        ? Math.round(proyectos.reduce((a, p) => a + p.progress, 0) / proyectos.length)
        : 0,
    };

    const todosU  = await User.find().sort({ rol: 1, area: 1 });
    const miembros = todosU.map(mapMiembro);

    res.render('proyectos.ejs', {
      usuario: { ...getUsuario(u), rol },
      proyectos, MIEMBROS, miembros, stats, notificaciones,
    });
  } catch (err) {
    console.error(err); res.redirect('/dashboard');
  }
});

// ── GET /equipo ──
router.get('/equipo', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const u       = await User.findById(req.session.userId);
    const todos   = await User.find().sort({ rol: 1, area: 1 });
    const miembros = todos.map(mapMiembro);
    const proyCount = await Project.countDocuments({ estado: { $in: ['activo','revision'] } });
    const stats = {
      miembros:        miembros.length,
      disponibles:     0,
      proyectos:       proyCount,
      nuevosProyectos: 0,
    };
    res.render('equipo.ejs', { usuario: getUsuario(u), miembros, stats });
  } catch (err) {
    console.error(err); res.redirect('/dashboard');
  }
});

/* ══════════════════════════════════════
   EQUIPO CRUD
══════════════════════════════════════ */
router.post('/invitar-miembro', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: 'No autorizado.' });
  const sesionUser = await User.findById(req.session.userId);
  if (sesionUser.rol !== 'directora') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
  const { nombre, id_empresarial, telefono, rol, area, password } = req.body;
  if (!nombre || !id_empresarial || !telefono || !rol || !password)
    return res.json({ ok: false, error: 'Completa todos los campos obligatorios.' });
  if (password.length < 6)
    return res.json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
  if ((rol === 'jefe' || rol === 'miembro') && !area)
    return res.json({ ok: false, error: 'Selecciona el área del integrante.' });
  try {
    const existe = await User.findOne({ id_empresarial });
    if (existe) return res.json({ ok: false, error: 'Ese ID empresarial ya existe.' });
    const hash  = await bcryptjs.hash(password, 10);
    const nuevo = await User.create({ nombre, id_empresarial, telefono, rol, area: area || null, password: hash });
    res.json({ ok: true, miembro: mapMiembro(nuevo) });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: 'Error al registrar el miembro.' });
  }
});

router.get('/generar-id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  const { rol } = req.query;
  try {
    if (rol === 'directora') return res.json({ ok: true, id: '11.00.001.001' });
    if (rol === 'jefe') {
      const count = await User.countDocuments({ rol: 'jefe' });
      const num   = String(count + 2).padStart(3, '0');
      return res.json({ ok: true, id: `11.00.${num}.222` });
    }
    if (rol === 'miembro') {
      const count = await User.countDocuments({ rol: 'miembro' });
      const num   = String(count + 101).padStart(3, '0');
      return res.json({ ok: true, id: `11.00.${num}.333` });
    }
    res.json({ ok: false, error: 'Rol no reconocido.' });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: 'Error al generar ID.' });
  }
});

/* ══════════════════════════════════════
   API — EVENTOS
══════════════════════════════════════ */
router.post('/api/eventos', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol === 'miembro') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    const { titulo, tipo, fecha, horaInicio, horaFin, lugar, descripcion, estado, tags, equipo, coleccion } = req.body;
    if (!titulo || !fecha) return res.json({ ok: false, error: 'Faltan datos obligatorios.' });
    const ev = await Event.create({
      titulo, tipo: tipo || 'casting',
      fecha: new Date(fecha),
      horaInicio: horaInicio || '', horaFin: horaFin || '',
      lugar: lugar || '', descripcion: descripcion || '',
      estado: estado || 'por_confirmar',
      tags:   Array.isArray(tags)   ? tags   : (tags   ? [tags]   : []),
      equipo: Array.isArray(equipo) ? equipo : (equipo ? [equipo] : []),
      coleccion: coleccion || '', creadoPor: u._id,
    });
    res.json({ ok: true, id: ev._id });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al crear evento.' }); }
});

router.put('/api/eventos/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol === 'miembro') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    const { titulo, tipo, fecha, horaInicio, horaFin, lugar, descripcion, estado } = req.body;
    const upd = {};
    if (titulo)      upd.titulo      = titulo;
    if (tipo)        upd.tipo        = tipo;
    if (fecha)       upd.fecha       = new Date(fecha);
    if (horaInicio !== undefined) upd.horaInicio = horaInicio;
    if (horaFin    !== undefined) upd.horaFin    = horaFin;
    if (lugar      !== undefined) upd.lugar      = lugar;
    if (descripcion!== undefined) upd.descripcion= descripcion;
    if (estado)      upd.estado      = estado;
    await Event.findByIdAndUpdate(req.params.id, upd);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al actualizar.' }); }
});

router.delete('/api/eventos/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol !== 'directora') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al eliminar.' }); }
});

/* ══════════════════════════════════════
   API — PROYECTOS
══════════════════════════════════════ */
router.post('/api/proyectos', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol === 'miembro') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    const { nombre, sub, coleccion, fechaEntrega, estado, equipo, color, colorBg, initials } = req.body;
    if (!nombre) return res.json({ ok: false, error: 'El nombre es obligatorio.' });
    const ws  = nombre.trim().split(' ');
    const ini = initials || (ws[0][0] + (ws[1]?.[0] || ws[0][1])).toUpperCase();
    const p   = await Project.create({
      nombre, sub: sub || '', initials: ini,
      color:   color   || '#cd1b80',
      colorBg: colorBg || 'rgba(205,27,128,0.18)',
      coleccion: coleccion || '',
      fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : undefined,
      estado: estado || 'planeacion',
      equipo: Array.isArray(equipo) ? equipo : (equipo ? [equipo] : []),
      creadoPor: u._id,
    });
    res.json({ ok: true, id: p._id });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al crear proyecto.' }); }
});

router.put('/api/proyectos/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol === 'miembro') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    const { nombre, coleccion, fechaEntrega, estado, progreso } = req.body;
    const upd = {};
    if (nombre)       upd.nombre       = nombre;
    if (coleccion !== undefined) upd.coleccion = coleccion;
    if (fechaEntrega) upd.fechaEntrega = new Date(fechaEntrega);
    if (estado)       upd.estado       = estado;
    if (progreso !== undefined) upd.progreso = Number(progreso);
    await Project.findByIdAndUpdate(req.params.id, upd);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al actualizar.' }); }
});

router.delete('/api/proyectos/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol !== 'directora') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al eliminar.' }); }
});

/* ══════════════════════════════════════
   API — COLECCIONES
══════════════════════════════════════ */
router.post('/api/colecciones', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol === 'miembro') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    const { nombre, temporada, descripcion, estado, imagen } = req.body;
    if (!nombre || !temporada || !estado) return res.json({ ok: false, error: 'Faltan datos obligatorios.' });
    const sc  = SEASON_CFG[temporada] || {};
    const col = await Collection.create({
      nombre, temporada, descripcion: descripcion || '',
      estado, imagen: imagen || '',
      color: sc.color || '#6f6f6f', colorBg: sc.colorBg || 'rgba(111,111,111,0.12)',
      creadoPor: u._id,
    });
    res.json({ ok: true, id: col._id });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al crear colección.' }); }
});

router.put('/api/colecciones/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol === 'miembro') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    const { nombre, temporada, descripcion, estado, progreso } = req.body;
    const upd = {};
    if (nombre      !== undefined) upd.nombre      = nombre;
    if (temporada   !== undefined) upd.temporada   = temporada;
    if (descripcion !== undefined) upd.descripcion = descripcion;
    if (estado      !== undefined) upd.estado      = estado;
    if (progreso    !== undefined) upd.progreso    = Number(progreso);
    await Collection.findByIdAndUpdate(req.params.id, upd);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al actualizar.' }); }
});

router.delete('/api/colecciones/:id', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false });
  try {
    const u = await User.findById(req.session.userId);
    if (u.rol !== 'directora') return res.status(403).json({ ok: false, error: 'Sin permisos.' });
    await Collection.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.json({ ok: false, error: 'Error al eliminar.' }); }
});

/* ══════════════════════════════════════
   PASSWORD RECOVERY
══════════════════════════════════════ */
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

router.get('/recuperar', (req, res) => res.render('recuperar.ejs', { error: null }));

router.post('/recuperar', async (req, res) => {
  const { telefono } = req.body;
  try {
    const usuario = await User.findOne({ telefono });
    if (!usuario) return res.render('recuperar.ejs', { error: 'No encontramos un usuario con ese número.' });
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    req.session.resetPin      = pin;
    req.session.resetTelefono = telefono;
    req.session.resetExpira   = Date.now() + 10 * 60 * 1000;
    await client.messages.create({
      body: `Tu PIN de RunwaySync es: ${pin}. Válido por 10 minutos.`,
      from: process.env.TWILIO_PHONE,
      to:   `+57${telefono}`,
    });
    res.redirect('/verificar-codigo');
  } catch (err) {
    console.error(err);
    res.render('recuperar.ejs', { error: 'Error al enviar el PIN. Intenta de nuevo.' });
  }
});

router.get('/verificar-codigo', (req, res) => {
  if (!req.session.resetPin) return res.redirect('/recuperar');
  res.render('verificar-codigo.ejs', { error: null });
});

router.post('/verificar-codigo', (req, res) => {
  const { digit1, digit2, digit3, digit4 } = req.body;
  const pinIngresado = `${digit1}${digit2}${digit3}${digit4}`;
  if (!req.session.resetPin) return res.redirect('/recuperar');
  if (Date.now() > req.session.resetExpira) {
    req.session.resetPin = null;
    return res.render('verificar-codigo.ejs', { error: 'El PIN expiró. Solicita uno nuevo.' });
  }
  if (pinIngresado !== req.session.resetPin)
    return res.render('verificar-codigo.ejs', { error: 'PIN incorrecto. Intenta de nuevo.' });
  req.session.resetVerificado = true;
  res.redirect('/nueva-contrasena');
});

router.get('/nueva-contrasena', (req, res) => {
  if (!req.session.resetVerificado) return res.redirect('/recuperar');
  res.render('nueva-contrasena.ejs', { error: null });
});

router.post('/nueva-contrasena', async (req, res) => {
  if (!req.session.resetVerificado) return res.redirect('/recuperar');
  const { password, confirmar } = req.body;
  if (password !== confirmar) return res.render('nueva-contrasena.ejs', { error: 'Las contraseñas no coinciden.' });
  if (password.length < 6)    return res.render('nueva-contrasena.ejs', { error: 'Mínimo 6 caracteres.' });
  try {
    const hash = await bcryptjs.hash(password, 10);
    await User.updateOne({ telefono: req.session.resetTelefono }, { password: hash });
    req.session.resetPin = req.session.resetTelefono = req.session.resetExpira = req.session.resetVerificado = null;
    res.redirect('/confirmacion');
  } catch (err) {
    console.error(err);
    res.render('nueva-contrasena.ejs', { error: 'Error al actualizar la contraseña.' });
  }
});

router.get('/confirmacion', (req, res) => res.render('confirmacion.ejs'));

export default router;
