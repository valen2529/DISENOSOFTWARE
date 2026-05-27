import 'dotenv/config';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from './models/User.model.js';

const usuarios = [
  // ── Directora ── 11.00.001.001
  { nombre: 'Marietta Ríos',       id_empresarial: '11.00.001.001', telefono: '3000000001', rol: 'directora',  area: null,          password: 'runway2024' },

  // ── Jefes de Área ── 11.00.00X.222
  { nombre: 'Juan Pablo Torres',   id_empresarial: '11.00.002.222', telefono: '3000000002', rol: 'jefe',       area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Camila López',        id_empresarial: '11.00.003.222', telefono: '3000000003', rol: 'jefe',       area: 'styling',     password: 'runway2024' },
  { nombre: 'Bruno Paredes',       id_empresarial: '11.00.004.222', telefono: '3000000004', rol: 'jefe',       area: 'produccion',  password: 'runway2024' },

  // ── Miembros Fotografía ── 11.00.101-103.333
  { nombre: 'Sofía Herrera',       id_empresarial: '11.00.101.333', telefono: '3000000101', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Diego Restrepo',      id_empresarial: '11.00.102.333', telefono: '3000000102', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Valeria Mora',        id_empresarial: '11.00.103.333', telefono: '3000000103', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },

  // ── Miembros Styling ── 11.00.104-106.333
  { nombre: 'Isabela Castro',      id_empresarial: '11.00.104.333', telefono: '3000000104', rol: 'miembro',    area: 'styling',     password: 'runway2024' },
  { nombre: 'Mateo Vargas',        id_empresarial: '11.00.105.333', telefono: '3000000105', rol: 'miembro',    area: 'styling',     password: 'runway2024' },
  { nombre: 'Luciana Peña',        id_empresarial: '11.00.106.333', telefono: '3000000106', rol: 'miembro',    area: 'styling',     password: 'runway2024' },

  // ── Miembros Producción ── 11.00.107-109.333
  { nombre: 'Andrés Jiménez',      id_empresarial: '11.00.107.333', telefono: '3000000107', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
  { nombre: 'Natalia Gómez',       id_empresarial: '11.00.108.333', telefono: '3000000108', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
  { nombre: 'Sebastián Ruiz',      id_empresarial: '11.00.109.333', telefono: '3000000109', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
];

const COLORES = {
  directora:  { color: '#cd1b80', bg: 'rgba(205,27,128,0.18)' },
  fotografia: { color: '#004aad', bg: 'rgba(0,74,173,0.18)'   },
  styling:    { color: '#08b864', bg: 'rgba(8,184,100,0.18)'  },
  produccion: { color: '#b88917', bg: 'rgba(184,137,23,0.18)' },
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.deleteMany({});
  console.log('Colección limpiada');

  for (const u of usuarios) {
    const hash = await bcryptjs.hash(u.password, 10);
    await User.create({ ...u, password: hash });
    console.log(`✅ ${u.nombre} (${u.id_empresarial})`);
  }

  console.log('\nSeed completado — 13 usuarios creados');
  process.exit();
}).catch(err => { console.error(err); process.exit(1); });
