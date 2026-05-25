import 'dotenv/config';
import express from 'express';
import { join } from 'path';
import mongoose from 'mongoose';
import session from 'express-session';

import appRouter from './routes/router.js';

const app  = express();
const port = process.env.PORT || 3000;

// ── MongoDB ──
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado ✓'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// ── Express ──
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(join('./public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Sesión ──
app.use(session({
  secret: process.env.SESSION_SECRET || 'runwaysync_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 },
}));

app.use('/', appRouter);

app.listen(port, () => {
  console.log(`Servidor corriendo 🚀 en http://localhost:${port}`);
});
