import mongoose from 'mongoose';
const { Schema } = mongoose;

const EventSchema = new Schema({
  titulo:      { type: String, required: true },
  tipo:        { type: String, enum: ['casting','editorial','fitting','reunion'], default: 'casting' },
  fecha:       { type: Date, required: true },
  horaInicio:  { type: String, default: '' },
  horaFin:     { type: String, default: '' },
  lugar:       { type: String, default: '' },
  descripcion: { type: String, default: '' },
  estado:      { type: String, enum: ['confirmado','pendiente','por_confirmar'], default: 'por_confirmar' },
  tags:        [{ type: String }],
  equipo:      [{ type: Schema.Types.ObjectId, ref: 'User' }],
  coleccion:   { type: String, default: '' },
  creadoPor:   { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Event', EventSchema);
