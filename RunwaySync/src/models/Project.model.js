import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProjectSchema = new Schema({
  nombre:       { type: String, required: true },
  sub:          { type: String, default: '' },
  initials:     { type: String, default: '' },
  color:        { type: String, default: '#cd1b80' },
  colorBg:      { type: String, default: 'rgba(205,27,128,0.18)' },
  coleccion:    { type: String, default: '' },
  progreso:     { type: Number, default: 0, min: 0, max: 100 },
  fechaEntrega: { type: Date },
  estado:       { type: String, enum: ['activo','revision','planeacion','completado'], default: 'planeacion' },
  equipo:       [{ type: Schema.Types.ObjectId, ref: 'User' }],
  creadoPor:    { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Project', ProjectSchema);
