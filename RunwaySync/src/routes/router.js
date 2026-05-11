import { Router } from "express";
import express from "express";
import authRoutes from './auth.routes.js';

const router = Router();

router.use(express.urlencoded({ extended: true }));

// ── Miembros del equipo ──
const MIEMBROS = {
  MR: { nombre: 'Marietta',   rol: 'Dir. Creativa', color: '#cd1b80', colorBg: 'rgba(205,27,128,0.18)' },
  JP: { nombre: 'Juan Pablo', rol: 'Fotógrafo',     color: '#004aad', colorBg: 'rgba(0,74,173,0.18)'   },
  CL: { nombre: 'Camila',     rol: 'Stylist',       color: '#08b864', colorBg: 'rgba(8,184,100,0.18)'  },
  BP: { nombre: 'Bruno',      rol: 'Productor',     color: '#b88917', colorBg: 'rgba(184,137,23,0.18)' },
};

// ── Usuarios de demo ──
const USUARIOS = {
  directora: { id:'MR', nombre:'Marietta', rol:'directora', rolLabel:'Directora Creativa',          area:null         },
  jefe:      { id:'BP', nombre:'Bruno',    rol:'jefe',      rolLabel:'Jefe de Área · Producción',   area:'produccion' },
  miembro:   { id:'CL', nombre:'Camila',   rol:'miembro',   rolLabel:'Miembro de Equipo · Styling', area:null         },
};

// ── Datos de proyectos ──
const PROYECTOS_DATA = [
  { id:1, initials:'SS', name:'Editorial SS26 Vogue Milan',      sub:'Fotografía · Producción',  collection:'SS26',   progress:75, delivery:'28 abr', deliveryDate:'2026-04-28', status:'activo',     team:['MR','JP','CL'], area:'fotografia',     color:'#cd1b80', colorBg:'rgba(205,27,128,0.18)' },
  { id:2, initials:'FW', name:'Lookbook FW26 — Campaña Digital', sub:'Fotografía · Diseño',      collection:'FW26',   progress:40, delivery:'15 may', deliveryDate:'2026-05-15', status:'revision',   team:['MR','BP'],      area:'diseno',         color:'#08b864', colorBg:'rgba(8,184,100,0.18)'  },
  { id:3, initials:'RS', name:'Moodboard Resort 2026',           sub:'Dirección de arte',        collection:'Resort', progress:20, delivery:'1 jun',  deliveryDate:'2026-06-01', status:'planeacion', team:['MR','JP'],      area:'arte',           color:'#004aad', colorBg:'rgba(0,74,173,0.18)'   },
  { id:4, initials:'EV', name:'Producción Evento Showroom',      sub:'Eventos · Producción',     collection:'FW26',   progress:50, delivery:'20 may', deliveryDate:'2026-05-20', status:'activo',     team:['BP','CL'],      area:'produccion',     color:'#b88917', colorBg:'rgba(184,137,23,0.18)' },
  { id:5, initials:'CO', name:'Catálogo Digital Temporada',      sub:'Diseño · Contenido',       collection:'SS26',   progress:10, delivery:'30 jun', deliveryDate:'2026-06-30', status:'planeacion', team:['MR'],           area:'diseno',         color:'#231f20', colorBg:'rgba(35,31,32,0.12)'   },
  { id:6, initials:'PR', name:'Prensa y PR Vogue CDMX',          sub:'Comunicaciones',           collection:'FW26',   progress:60, delivery:'28 abr', deliveryDate:'2026-04-28', status:'revision',   team:['MR','CL'],      area:'comunicaciones', color:'#7611bd', colorBg:'rgba(118,17,189,0.18)' },
  { id:7, initials:'CA', name:'Casting & Selección Modelos',     sub:'Casting · Producción',     collection:'SS26',   progress:85, delivery:'23 abr', deliveryDate:'2026-04-23', status:'activo',     team:['JP','BP','CL'], area:'casting',        color:'#08b864', colorBg:'rgba(8,184,100,0.18)'  },
];

// ── Datos de eventos ──
const EVENTOS_DATA = [
  {
    id:1, dia:23, mes:'ABR',
    nombre:'Casting Modelos SS26',
    tipo:'casting',
    status:'confirmado',
    lugar:'Estudio Norte',
    hora:'10:00 AM – 2:00 PM',
    descripcion:'Selección de modelos para la campaña Spring/Summer 2026. Se evaluarán 12 perfiles pre-seleccionados por agencia.',
    tags:['Casting','SS26'],
    team:['MR','JP','CL'],
    color:'#cd1b80',
    dateStr:'2026-04-23',
  },
  {
    id:2, dia:24, mes:'ABR',
    nombre:'Fitting Final Colección FW26',
    tipo:'fitting',
    status:'confirmado',
    lugar:'Atelier Principal',
    hora:'2:00 PM – 6:00 PM',
    descripcion:'Revisión final de prendas antes de la sesión fotográfica. Ajustes de sastrería y aprobación de la directora creativa.',
    tags:['Fitting','FW26'],
    team:['MR','BP'],
    color:'#b88917',
    dateStr:'2026-04-24',
  },
  {
    id:3, dia:28, mes:'ABR',
    nombre:'Sesión Editorial Vogue CDMX',
    tipo:'editorial',
    status:'pendiente',
    lugar:'Locación TBD',
    hora:'Todo el día',
    descripcion:'Sesión fotográfica para publicación en Vogue México. Colección FW26 completa con equipo de producción externo.',
    tags:['Editorial','FW26','Prensa'],
    team:['MR','JP','CL','BP'],
    color:'#08b864',
    dateStr:'2026-04-28',
  },
  {
    id:4, dia:2, mes:'MAY',
    nombre:'Reunión FW2026 — Dirección Creativa',
    tipo:'reunion',
    status:'por_confirmar',
    lugar:'Sala de juntas',
    hora:'9:00 AM – 11:00 AM',
    descripcion:'Revisión de avances FW26 y definición de dirección para Resort 2026. Presentación de moodboard y referencias.',
    tags:['Reunión','FW26'],
    team:['MR','JP'],
    color:'#004aad',
    dateStr:'2026-05-02',
  },
];

const PROXIMOS_MAYO = [
  { nombre:'Casting Resort 2026',         fecha:'5 may',  lugar:'Estudio Sur',   color:'#cd1b80' },
  { nombre:'Fitting SS26 — Ronda 1',      fecha:'12 may', lugar:'Atelier',       color:'#004aad' },
  { nombre:'Shooting Lookbook FW26',      fecha:'18 may', lugar:'Estudio Norte', color:'#08b864' },
  { nombre:'Presentación Colección SS26', fecha:'28 may', lugar:'Showroom',      color:'#7611bd' },
];

// ── Rutas ──

// Pantalla de inicio
router.get('/', (req, res) => {
  res.render('index.ejs');
});

router.get('/login', (req, res) => {
  res.render('login.ejs');
});


// Login POST
router.post('/login', (req, res) => {
  res.redirect('/dashboard');
});

// Dashboard
router.get('/dashboard', (req, res) => {
  res.render('dashboard.ejs');
});

// Calendario
router.get('/calendario', (req, res) => {
  res.render('calendario.ejs');
});

export default router;
