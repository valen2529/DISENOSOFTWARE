import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from './models/User.model.js';

mongoose.connect('mongodb://localhost:27017/runwaysync').then(async () => {
  const hash = await bcryptjs.hash('123456', 10);
  await User.create({
    nombre: 'Sara',
    email: 'saraletradoco@gmail.com',
    password: hash,
  });
  console.log('Usuario creado ✅');
  process.exit();
});
