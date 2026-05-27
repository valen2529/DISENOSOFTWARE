import mongoose from 'mongoose';
const { Schema } = mongoose;

const PrendaSchema = new Schema({
  nombre:    { type: String, default: '' },
  categoria: { type: String, default: '' },
  img:       { type: String, default: '' },
  desc:      { type: String, default: '' },
  material:  { type: String, default: '' },
  color:     { type: String, default: '' },
  talla:     { type: String, default: '' },
  estado:    { type: String, default: '' },
  swatches:  [{ type: String }],
}, { _id: true });

const CollectionSchema = new Schema({
  nombre:      { type: String, required: true },
  temporada:   { type: String, default: '' },
  descripcion: { type: String, default: '' },
  estado:      { type: String, default: '' },
  progreso:    { type: Number, default: 0 },
  imagen:      { type: String, default: '' },
  color:       { type: String, default: '' },
  colorBg:     { type: String, default: '' },
  swatches:    [{ type: String }],
  tags:        [{ type: String }],
  prendas:     [PrendaSchema],
  creadoPor:   { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Collection', CollectionSchema);
