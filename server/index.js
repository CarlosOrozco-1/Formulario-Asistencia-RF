/**
 * Sistema de Asistencia RF - Servidor Express
 * 
 * Orquestador del backend: sirve archivos estaticos y expone la API REST.
 * Escucha en el puerto definido por process.env.PORT o 3000 por defecto.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const { conectarDB } = require('./database/connection');
const authRoutes = require('./routes/auth');
const asistenciasRoutes = require('./routes/asistencias');
const usuariosRoutes = require('./routes/usuarios');
const miembrosRoutes = require('./routes/miembros');
const gruposRoutes = require('./routes/grupos');
const categoriasRoutes = require('./routes/categorias');
const puebloRoutes = require('./routes/pueblo');
const { verificarToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware globales
app.use(cors());
app.use(express.json());

// Sirve los archivos estaticos del frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Inicializa la base de datos SQLite y la pone a disposicion de las rutas
const db = conectarDB();
app.locals.db = db;

// Rutas publicas (sin JWT)
app.use('/api/auth', authRoutes);

// Endpoint publico para registro de asistencia del pueblo
// Cualquier persona puede registrar asistencia sin necesidad de login
app.post('/api/publico/pueblo/asistencia', (req, res) => {
    const db = req.app.locals.db;
    const { categoria_id, fecha, cantidad, servicio } = req.body;
    if (!categoria_id || !fecha) {
        return res.status(400).json({ error: 'Categoria y fecha son requeridas' });
    }
    const result = db.prepare(`
        INSERT INTO asistencias (categoria_id, fecha, tipo, cantidad, servicio)
        VALUES (?, ?, 'pueblo', ?, ?)
    `).run(categoria_id, fecha, cantidad || 1, servicio || null);
    res.json({ success: true, id: result.lastInsertRowid });
});

// Rutas protegidas (requieren JWT valido)
app.use('/api/asistencias', verificarToken, asistenciasRoutes);
app.use('/api/usuarios', verificarToken, usuariosRoutes);
app.use('/api/miembros', verificarToken, miembrosRoutes);
app.use('/api/grupos', verificarToken, gruposRoutes);
app.use('/api/categorias', verificarToken, categoriasRoutes);
app.use('/api/pueblo', verificarToken, puebloRoutes);

// Inicia el servidor en el puerto configurado
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
