import express from 'express';
import session from 'express-session';
import { join, resolve } from "path";

import appRouter from "./routes/router.js";

const app = express();
const port = 3000;

app.set("view engine", 'ejs');
app.set("views", "views");
app.use(express.static(join("./public")));

app.use(session({
  secret: process.env.SESSION_SECRET || 'runwaysync-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 },
}));

app.use("/", appRouter);

app.listen(port, () => {
  console.log(`Server running 🚀 at http://localhost:${port}`);
});
