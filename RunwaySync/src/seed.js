import 'dotenv/config';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from './models/User.model.js';

const usuarios = [
  // ── Directora (001) ──
  { nombre: 'Marietta Ríos',       id_empresarial: '11.00.001.001', telefono: '3000000001', rol: 'directora',  area: null,          password: 'runway2024' },

  // ── Jefes de Área (X00) ──
  { nombre: 'Juan Pablo Torres',   id_empresarial: '11.00.001.100', telefono: '3000000100', rol: 'jefe',       area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Camila López',        id_empresarial: '11.00.001.200', telefono: '3000000200', rol: 'jefe',       area: 'styling',     password: 'runway2024' },
  { nombre: 'Bruno Paredes',       id_empresarial: '11.00.001.300', telefono: '3000000300', rol: 'jefe',       area: 'produccion',  password: 'runway2024' },

  // ── Miembros Fotografía (1XX) ──
  { nombre: 'Sofía Herrera',       id_empresarial: '11.00.001.101', telefono: '3000000101', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Diego Restrepo',      id_empresarial: '11.00.001.102', telefono: '3000000102', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },
  { nombre: 'Valeria Mora',        id_empresarial: '11.00.001.103', telefono: '3000000103', rol: 'miembro',    area: 'fotografia',  password: 'runway2024' },

  // ── Miembros Styling (2XX) ──
  { nombre: 'Isabela Castro',      id_empresarial: '11.00.001.201', telefono: '3000000201', rol: 'miembro',    area: 'styling',     password: 'runway2024' },
  { nombre: 'Mateo Vargas',        id_empresarial: '11.00.001.202', telefono: '3000000202', rol: 'miembro',    area: 'styling',     password: 'runway2024' },
  { nombre: 'Luciana Peña',        id_empresarial: '11.00.001.203', telefono: '3000000203', rol: 'miembro',    area: 'styling',     password: 'runway2024' },

  // ── Miembros Producción (3XX) ──
  { nombre: 'Andrés Jiménez',      id_empresarial: '11.00.001.301', telefono: '3000000301', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
  { nombre: 'Natalia Gómez',       id_empresarial: '11.00.001.302', telefono: '3000000302', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
  { nombre: 'Sebastián Ruiz',      id_empresarial: '11.00.001.303', telefono: '3000000303', rol: 'miembro',    area: 'produccion',  password: 'runway2024' },
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
