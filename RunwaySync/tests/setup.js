// Configuración compartida de pruebas
// Evita que el servidor intente conectar a MongoDB real durante los tests

import { vi } from 'vitest';

// Variables de entorno de prueba
process.env.MONGODB_URI    = 'mongodb://localhost/runwaysync_test';
process.env.SESSION_SECRET = 'test_secret_key';
process.env.NODE_ENV       = 'test';

// Silencia console.error en tests para mantener output limpio
vi.spyOn(console, 'error').mockImplementation(() => {});
