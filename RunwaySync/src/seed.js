import 'dotenv/config';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from './models/User.model.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const hash = await bcryptjs.hash('123456', 10);
  await User.create({
    nombre: 'Sara',
    id_empresarial: '11.00.095.532',
    telefono: '3000000000',
    rol: 'directora',
    email: 'saraletradoco@gmail.com',
    password: hash,
  });
  console.log('Usuario creado ✅');
  process.exit();
});