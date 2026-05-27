import 'dotenv/config';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User       from './models/User.model.js';
import Event      from './models/Event.model.js';
import Project    from './models/Project.model.js';
import Collection from './models/Collection.model.js';

const usuarios = [
  { nombre: 'Marietta Ríos',       id_empresarial: '11.00.001.001', telefono: '3000000001', rol: 'directora',  area: null,          password: 'runway2024' },
  { nombre: 'Juan Pablo Torres',   id_empresarial: '11.00.002.222', telefono: '3000000002', rol: 'jefe',       area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Camila López',        id_empresarial: '11.00.003.222', telefono: '3000000003', rol: 'jefe',       area: 'styling',     password: 'runway2024' },
  { nombre: 'Bruno Paredes',       id_empresarial: '11.00.004.222', telefono: '3000000004', rol: 'jefe',       area: 'produccion',  password: 'runway2024' },
  { nombre: 'Sofía Herrera',       id_empresarial: '11.00.101.333', telefono: '3000000101', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Diego Restrepo',      id_empresarial: '11.00.102.333', telefono: '3000000102', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Valeria Mora',        id_empresarial: '11.00.103.333', telefono: '3000000103', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Isabela Castro',      id_empresarial: '11.00.104.333', telefono: '3000000104', rol: 'miembro',    area: 'styling',     password: 'runway2024' },
  { nombre: 'Mateo Vargas',        id_empresarial: '11.00.105.333', telefono: '3000000105', rol: 'miembro',    area: 'styling',     password: 'runway2024' },
  { nombre: 'Luciana Peña',        id_empresarial: '11.00.106.333', telefono: '3000000106', rol: 'miembro',    area: 'styling',     password: 'runway2024' },
  { nombre: 'Andrés Jiménez',      id_empresarial: '11.00.107.333', telefono: '3000000107', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
  { nombre: 'Natalia Gómez',       id_empresarial: '11.00.108.333', telefono: '3000000108', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
  { nombre: 'Sebastián Ruiz',      id_empresarial: '11.00.109.333', telefono: '3000000109', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {

  /* ── Users ── */
  await User.deleteMany({});
  console.log('Colección users limpiada');
  for (const u of usuarios) {
    const hash = await bcryptjs.hash(u.password, 10);
    await User.create({ ...u, password: hash });
    console.log(`✅ ${u.nombre} (${u.id_empresarial})`);
  }

  /* ── Fetch user refs for seeding ── */
  const marietta = await User.findOne({ id_empresarial: '11.00.001.001' });
  const jp       = await User.findOne({ id_empresarial: '11.00.002.222' });
  const camila   = await User.findOne({ id_empresarial: '11.00.003.222' });
  const bruno    = await User.findOne({ id_empresarial: '11.00.004.222' });

  /* ── Events ── */
  await Event.deleteMany({});
  const eventosData = [
    {
      titulo: 'Fitting FW26',
      tipo: 'fitting',
      fecha: new Date('2026-05-06'),
      horaInicio: '10:00', horaFin: '14:00',
      lugar: 'Atelier Central',
      descripcion: 'Fitting de prendas para la colección Fall-Winter 2026',
      estado: 'pendiente',
      tags: ['Fitting', 'FW26'],
      equipo: [marietta._id, camila._id],
      coleccion: 'FW26',
      creadoPor: marietta._id,
    },
    {
      titulo: 'Casting SS26',
      tipo: 'casting',
      fecha: new Date('2026-05-12'),
      horaInicio: '10:00', horaFin: '18:00',
      lugar: 'Estudio Norte',
      descripcion: 'Primer casting de modelos para colección Spring-Summer 2026',
      estado: 'confirmado',
      tags: ['Casting', 'SS26'],
      equipo: [marietta._id, jp._id, camila._id],
      coleccion: 'SS26',
      creadoPor: marietta._id,
    },
    {
      titulo: 'Revisión Look Book',
      tipo: 'fitting',
      fecha: new Date('2026-05-15'),
      horaInicio: '11:00', horaFin: '14:00',
      lugar: 'Oficina RunwaySync',
      descripcion: 'Revisión y aprobación del Look Book SS26',
      estado: 'por_confirmar',
      tags: ['SS26'],
      equipo: [marietta._id, jp._id],
      coleccion: 'SS26',
      creadoPor: marietta._id,
    },
    {
      titulo: 'Sesión Editorial',
      tipo: 'editorial',
      fecha: new Date('2026-05-26'),
      horaInicio: '08:00', horaFin: '20:00',
      lugar: 'Locación TBD',
      descripcion: 'Sesión editorial principal para Vogue CDMX SS26',
      estado: 'por_confirmar',
      tags: ['Editorial', 'SS26'],
      equipo: [marietta._id, jp._id, camila._id, bruno._id],
      coleccion: 'SS26',
      creadoPor: marietta._id,
    },
  ];
  for (const ev of eventosData) {
    await Event.create(ev);
    console.log(`📅 Evento: ${ev.titulo}`);
  }

  /* ── Projects ── */
  await Project.deleteMany({});
  const proyectosData = [
    {
      nombre: 'Editorial SS26 Vogue Milan',
      sub: 'Fotografía · Producción',
      initials: 'SS',
      color: '#cd1b80', colorBg: 'rgba(205,27,128,0.18)',
      coleccion: 'SS26', progreso: 75,
      fechaEntrega: new Date('2026-04-28'),
      estado: 'activo',
      equipo: [marietta._id, jp._id],
      creadoPor: marietta._id,
    },
    {
      nombre: 'Colección FW26 Lookbook',
      sub: 'Diseño · Fotografía',
      initials: 'FW',
      color: '#004aad', colorBg: 'rgba(0,74,173,0.18)',
      coleccion: 'FW26', progreso: 40,
      fechaEntrega: new Date('2026-06-15'),
      estado: 'activo',
      equipo: [marietta._id, camila._id],
      creadoPor: marietta._id,
    },
    {
      nombre: 'Resort 2027 Moodboard',
      sub: 'Dirección de Arte',
      initials: 'RS',
      color: '#08b864', colorBg: 'rgba(8,184,100,0.18)',
      coleccion: 'Resort', progreso: 20,
      fechaEntrega: new Date('2026-07-30'),
      estado: 'planeacion',
      equipo: [marietta._id],
      creadoPor: marietta._id,
    },
    {
      nombre: 'Evento Vogue CDMX',
      sub: 'Producción · Logística',
      initials: 'EV',
      color: '#b88917', colorBg: 'rgba(184,137,23,0.18)',
      coleccion: 'SS26', progreso: 50,
      fechaEntrega: new Date('2026-05-26'),
      estado: 'revision',
      equipo: [marietta._id, bruno._id],
      creadoPor: marietta._id,
    },
  ];
  for (const p of proyectosData) {
    await Project.create(p);
    console.log(`📁 Proyecto: ${p.nombre}`);
  }

  /* ── Collections ── */
  await Collection.deleteMany({});
  const coleccionesData = [
    {
      nombre: 'Tierra Roja',
      temporada: 'SS26',
      descripcion: 'Inspirada en los paisajes áridos y la riqueza cromática de los territorios mexicanos del norte. Texturas naturales, siluetas estructuradas y una paleta cálida que evoca la tierra arcillosa y el atardecer.',
      estado: 'En producción',
      progreso: 75,
      imagen: '/img/coleccion/brown.png',
      color: '#cd1b80', colorBg: 'rgba(205,27,128,0.12)',
      swatches: ['#8B2E00','#C4642B','#E8A87C','#231f20'],
      tags: ['SS26','Editorial','Vogue','Fotografía'],
      prendas: [
        { nombre:'Vestido Oaxaca',  categoria:'Vestidos',   img:'/img/coleccion/dress.png',    desc:'Vestido midi de línea A en tela de lino con bordado artesanal en el escote.',  material:'Lino 100%',    color:'Tierra / Cobre', talla:'XS–L',  estado:'Producción', swatches:['#C4642B','#8B2E00','#231f20'] },
        { nombre:'Blazer Tierra',   categoria:'Sacos',      img:'/img/coleccion/blazer.png',   desc:'Blazer oversize con estructura de hombros marcados. Forro en seda natural.',    material:'Lana / Seda',  color:'Cobre oscuro',   talla:'XS–XL', estado:'Aprobado',    swatches:['#8B2E00','#5A1E00'] },
        { nombre:'Pantalón Cobre',  categoria:'Pantalones', img:'/img/coleccion/pantalon.png', desc:'Pantalón de corte recto con pinzas frontales. Tiro alto y largo a tobillo.',    material:'Gabardina',    color:'Cobre / Arena',  talla:'24–32', estado:'Ajuste',      swatches:['#C4642B','#E8A87C'] },
        { nombre:'Vestido Tabaco',  categoria:'Vestidos',   img:'/img/coleccion/arena.png',    desc:'Vestido largo de escote cruzado en crepe de seda. Falda con vuelo en corte sesgado.', material:'Crepe de seda', color:'Arena / Tabaco', talla:'XS–L', estado:'Producción', swatches:['#E8A87C','#D4A574','#A67C52'] },
      ],
      creadoPor: marietta._id,
    },
    {
      nombre: 'Neorromanticismo',
      temporada: 'FW26',
      descripcion: 'Una exploración del romanticismo contemporáneo a través de volúmenes dramáticos, encajes delicados y una paleta de lavandas profundas y ciruelas.',
      estado: 'En diseño',
      progreso: 40,
      imagen: '/img/coleccion/lavender.png',
      color: '#004aad', colorBg: 'rgba(0,74,173,0.12)',
      swatches: ['#6B4E8A','#C9B8E2','#2C1A3A','#F5F0FF'],
      tags: ['FW26','Campaña Digital','Lookbook'],
      prendas: [],
      creadoPor: marietta._id,
    },
    {
      nombre: 'Brisa',
      temporada: 'Resort27',
      descripcion: 'Una colección ligera y luminosa que captura la esencia del verano mediterráneo. Tejidos naturales transpirables y siluetas fluidas.',
      estado: 'Ideación',
      progreso: 20,
      imagen: '/img/coleccion/green.png',
      color: '#08b864', colorBg: 'rgba(8,184,100,0.12)',
      swatches: ['#4CAF6E','#A8D8B9','#F5F2E8','#1B4D3E'],
      tags: ['Resort 27','Dirección de Arte','Moodboard'],
      prendas: [],
      creadoPor: marietta._id,
    },
  ];
  for (const c of coleccionesData) {
    await Collection.create(c);
    console.log(`👗 Colección: ${c.nombre}`);
  }

  console.log('\n✅ Seed completado — 13 usuarios, 4 eventos, 4 proyectos, 3 colecciones');
  process.exit();
}).catch(err => { console.error(err); process.exit(1); });
