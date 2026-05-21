import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  nombre:           { type: String, required: true },
  id_empresarial:   { type: String, required: true, unique: true },
  telefono:         { type: String, required: true },
  rol:              { type: String, required: true, enum: ['directora', 'jefe', 'miembro'] },
  email:            { type: String },
  password:         { type: String, required: true },
  resetCode:        { type: String },
  resetCodeExpires: { type: Date },
});

export default mongoose.model('User', userSchema);