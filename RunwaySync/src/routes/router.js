import { Router } from 'express';
import twilio from 'twilio';
import User from '../models/User.model.js';
import bcryptjs from 'bcryptjs';

const router = Router();
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

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

const getUsuario = (u) => {
  const colorKey = u.rol === 'directora' ? 'directora' : u.area;
  const c = ROL_COLOR[colorKey] || { color: '#6f6f6f', bg: 'rgba(111,111,111,0.15)' };
  const words = u.nombre.trim().split(' ');
  const ini = (words[0][0] + (words[1]?.[0] || words[0][1])).toUpperCase();
  return {
    id:       u.id_empresarial,
    ini,
    nombre:   u.nombre,
    rol:      u.rol,
    area:     u.area || null,
    rolLabel: ROL_LABEL[u.rol] || u.rol,
    color:    c.color,
    colorBg:  c.bg,
  };
};

const MIEMBROS = {
  MR: { nombre:'Marietta', rol:'Dir. Creativa', color:'#cd1b80', colorBg:'rgba(205,27,128,0.18)' },
  JP: { nombre:'Juan Pablo', rol:'Fotógrafo', color:'#004aad', colorBg:'rgba(0,74,173,0.18)' },
  CL: { nombre:'Camila', rol:'Stylist', color:'#08b864', colorBg:'rgba(8,184,100,0.18)' },
  BP: { nombre:'Bruno', rol:'Productor', color:'#b88917', colorBg:'rgba(184,137,23,0.18)' },
  AG: { nombre:'Agencia', rol:'Externo', color:'#7611bd', colorBg:'rgba(118,17,189,0.18)' },
};

// ── GET / y /login ──
router.get('/', (req, res) => {
  res.render('index.ejs', { error: null });
});

router.get('/login', (req, res) => {
  res.redirect('/');
});

// ── POST /login ──
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

// ── GET /dashboard ──
router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  try {
    const u = await User.findById(req.session.userId);
    if (!u) return res.redirect('/');
    res.render('dashboard.ejs', { usuario: getUsuario(u) });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// ── GET /calendario ──
router.get('/calendario', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const u = await User.findById(req.session.userId);
  res.render('calendario.ejs', { usuario: getUsuario(u) });
});

// ── GET /colecciones ──
router.get('/colecciones', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const u = await User.findById(req.session.userId);
  res.render('colecciones.ejs', { usuario: getUsuario(u) });
});

// ── GET /eventos ──
router.get('/eventos', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const u   = await User.findById(req.session.userId);
  const rol = u.rol;
  const eventos = [
    { id:1, nombre:'Casting SS26', tipo:'casting', dia:'12', mes:'MAY', lugar:'Estudio Norte', hora:'10:00 AM – 6:00 PM', descripcion:'Primer casting de modelos para colección SS26', status:'confirmado', color:'#cd1b80', tags:['Casting','SS26'], team:['MR','JP','CL'], dateStr:'2026-05-12', canEdit: rol==='directora', canDelete: rol==='directora' },
    { id:2, nombre:'Fitting FW26', tipo:'fitting', dia:'15', mes:'MAY', lugar:'Atelier Central', hora:'11:00 AM – 2:00 PM', descripcion:'Revisión de prendas para colección FW26', status:'pendiente', color:'#b88917', tags:['Fitting','FW26'], team:['MR','CL'], dateStr:'2026-05-15', canEdit: rol!=='miembro', canDelete: rol==='directora' },
    { id:3, nombre:'Sesión Editorial', tipo:'editorial', dia:'26', mes:'MAY', lugar:'Locación TBD', hora:'8:00 AM – 8:00 PM', descripcion:'Sesión editorial principal para Vogue CDMX', status:'por_confirmar', color:'#08b864', tags:['Editorial','SS26'], team:['MR','JP','CL','BP'], dateStr:'2026-05-26', canEdit: rol==='directora', canDelete: rol==='directora' },
  ];
  const resumen = {
    total: eventos.length,
    confirmados: eventos.filter(e => e.status === 'confirmado').length,
    pendientes:  eventos.filter(e => e.status === 'pendiente').length,
    porConfirmar: eventos.filter(e => e.status === 'por_confirmar').length,
  };
  const PROXIMOS_MAYO = [
    { nombre:'Casting SS26',    fecha:'12 Mayo', lugar:'Estudio Norte',   color:'#cd1b80' },
    { nombre:'Fitting FW26',    fecha:'15 Mayo', lugar:'Atelier Central', color:'#b88917' },
    { nombre:'Sesión Editorial',fecha:'26 Mayo', lugar:'TBD',             color:'#08b864' },
  ];
  res.render('eventos.ejs', {
    usuario: { ...getUsuario(u), rol },
    eventos, MIEMBROS, resumen, PROXIMOS_MAYO
  });
});

// ── GET /proyectos ──
router.get('/proyectos', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const u   = await User.findById(req.session.userId);
  const rol = u.rol;
  const proyectos = [
    { id:1, name:'Editorial SS26 Vogue Milan', sub:'Fotografía · Producción', initials:'SS', color:'#cd1b80', colorBg:'rgba(205,27,128,0.18)', collection:'SS26', progress:75, delivery:'28 Abr', deliveryDate:'2026-04-28', status:'activo',     overdue:true,  team:['MR','JP'], canEdit: rol!=='miembro', canDelete: rol==='directora' },
    { id:2, name:'Colección FW26 Lookbook',    sub:'Diseño · Fotografía',     initials:'FW', color:'#004aad', colorBg:'rgba(0,74,173,0.18)',   collection:'FW26', progress:40, delivery:'15 Jun', deliveryDate:'2026-06-15', status:'activo',     overdue:false, team:['MR','CL'], canEdit: rol!=='miembro', canDelete: rol==='directora' },
    { id:3, name:'Resort 2027 Moodboard',      sub:'Dirección de Arte',        initials:'RS', color:'#08b864', colorBg:'rgba(8,184,100,0.18)',  collection:'Resort',progress:20, delivery:'30 Jul', deliveryDate:'2026-07-30', status:'planeacion', overdue:false, team:['MR'],      canEdit: rol==='directora', canDelete: rol==='directora' },
    { id:4, name:'Evento Vogue CDMX',          sub:'Producción · Logística',   initials:'EV', color:'#b88917', colorBg:'rgba(184,137,23,0.18)', collection:'SS26', progress:50, delivery:'26 May', deliveryDate:'2026-05-26', status:'revision',   overdue:false, team:['MR','BP'], canEdit: rol!=='miembro', canDelete: rol==='directora' },
  ];
  const stats = {
    total:      proyectos.length,
    activos:    proyectos.filter(p => p.status === 'activo').length,
    revision:   proyectos.filter(p => p.status === 'revision').length,
    completados:proyectos.filter(p => p.status === 'completado').length,
    avance:     Math.round(proyectos.reduce((a, p) => a + p.progress, 0) / proyectos.length),
  };
  res.render('proyectos.ejs', {
    usuario: { ...getUsuario(u), rol },
    proyectos, MIEMBROS, stats
  });
});

// ── Helpers de equipo ──
const AREA_COLOR = {
  directora:  { color: '#cd1b80', bg: 'rgba(205,27,128,0.18)' },
  fotografia: { color: '#004aad', bg: 'rgba(0,74,173,0.18)'   },
  styling:    { color: '#08b864', bg: 'rgba(8,184,100,0.18)'  },
  produccion: { color: '#b88917', bg: 'rgba(184,137,23,0.18)' },
};
const AREA_SKILLS = {
  fotografia: ['Fotografía','Edición','Iluminación'],
  styling:    ['Styling','Fitting','Tendencias'],
  produccion: ['Producción','Logística','Presupuesto'],
};
const AREA_LABEL = { fotografia:'Fotografía', styling:'Styling', produccion:'Producción' };

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
    rol:    u.rol, area: u.area || null,
    id_empresarial: u.id_empresarial,
    telefono: u.telefono,
    bg: c.bg, color: c.color,
    skills: u.rol === 'directora' ? ['Dirección','Moodboard','Casting'] : (AREA_SKILLS[u.area] || []),
    online: false,
  };
}

// ── GET /equipo ──
router.get('/equipo', async (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  const u        = await User.findById(req.session.userId);
  const todos    = await User.find().sort({ rol: 1, area: 1 });
  const miembros = todos.map(mapMiembro);

  const stats = {
    miembros:        miembros.length,
    disponibles:     miembros.filter(m => m.online).length,
    proyectos:       7,
    nuevosProyectos: 2,
  };
  res.render('equipo.ejs', { usuario: getUsuario(u), miembros, stats });
});

// ── POST /invitar-miembro ──
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
    const hash = await bcryptjs.hash(password, 10);
    const nuevo = await User.create({ nombre, id_empresarial, telefono, rol, area: area || null, password: hash });
    res.json({ ok: true, miembro: mapMiembro(nuevo) });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: 'Error al registrar el miembro.' });
  }
});

// ── GET /logout ──
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ── GET /recuperar ──
router.get('/recuperar', (req, res) => {
  res.render('recuperar.ejs', { error: null });
});

// ── POST /recuperar ──
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

// ── GET /verificar-codigo ──
router.get('/verificar-codigo', (req, res) => {
  if (!req.session.resetPin) return res.redirect('/recuperar');
  res.render('verificar-codigo.ejs', { error: null });
});

// ── POST /verificar-codigo ──
router.post('/verificar-codigo', (req, res) => {
  const { digit1, digit2, digit3, digit4 } = req.body;
  const pinIngresado = `${digit1}${digit2}${digit3}${digit4}`;
  if (!req.session.resetPin) return res.redirect('/recuperar');
  if (Date.now() > req.session.resetExpira) {
    req.session.resetPin = null;
    return res.render('verificar-codigo.ejs', { error: 'El PIN expiró. Solicita uno nuevo.' });
  }
  if (pinIngresado !== req.session.resetPin) {
    return res.render('verificar-codigo.ejs', { error: 'PIN incorrecto. Intenta de nuevo.' });
  }
  req.session.resetVerificado = true;
  res.redirect('/nueva-contrasena');
});

// ── GET /nueva-contrasena ──
router.get('/nueva-contrasena', (req, res) => {
  if (!req.session.resetVerificado) return res.redirect('/recuperar');
  res.render('nueva-contrasena.ejs', { error: null });
});

// ── POST /nueva-contrasena ──
router.post('/nueva-contrasena', async (req, res) => {
  if (!req.session.resetVerificado) return res.redirect('/recuperar');
  const { password, confirmar } = req.body;
  if (password !== confirmar) return res.render('nueva-contrasena.ejs', { error: 'Las contraseñas no coinciden.' });
  if (password.length < 6)    return res.render('nueva-contrasena.ejs', { error: 'Mínimo 6 caracteres.' });
  try {
    const hash = await bcryptjs.hash(password, 10);
    await User.updateOne({ telefono: req.session.resetTelefono }, { password: hash });
    req.session.resetPin = req.session.resetTelefono = req.session.resetExpira = req.session.resetVerificado = null;
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('nueva-contrasena.ejs', { error: 'Error al actualizar la contraseña.' });
  }
});

export default router;