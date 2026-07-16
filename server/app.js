/**
 * Factoría de Express que compone módulos y permite probar la API sin abrir un puerto.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const { crearMiddlewareAuth } = require('./middleware/auth');
const { crearMiddlewareSeguridad } = require('./middleware/security');
const { manejarErrores, rutaNoEncontrada } = require('./middleware/error');
const { crearAuthRouter } = require('./modules/auth/auth.routes');
const {
    crearAsistenciasRouter
} = require('./modules/asistencias/asistencias.routes');
const {
    crearCategoriasRouter,
    crearPuebloPublicoRouter,
    crearPuebloRouter
} = require('./modules/pueblo/pueblo.routes');
const {
    crearGruposRouter,
    crearMiembrosRouter
} = require('./modules/discipulado/discipulado.routes');
const { crearUsuariosRouter } = require('./modules/usuarios/usuarios.routes');

// Recibe infraestructura explícita para no ocultar la base de datos en app.locals.
const crearApp = ({ db, config }) => {
    const app = express();
    const { verificarToken } = crearMiddlewareAuth(config.jwtSecret);
    const seguridad = crearMiddlewareSeguridad(config);

    // Configura capacidades transversales antes de montar los módulos.
    app.disable('x-powered-by');
    app.use(seguridad.establecerCabeceras);
    app.use(cors({
        origin: seguridad.permitirCors
    }));
    app.use(express.json({ limit: config.jsonBodyLimit }));
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // Expone un healthcheck sin autenticación para contenedores y balanceadores.
    app.get('/healthz', (req, res, next) => {
        try {
            const database = db.prepare('SELECT 1 AS ok').get().ok === 1 ? 'ok' : 'error';
            res.setHeader('Cache-Control', 'no-store');
            res.json({
                status: 'ok',
                database,
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    });

    // Monta rutas públicas de forma explícita para facilitar la auditoría de seguridad.
    app.use('/api/auth/login', seguridad.limitarLogin);
    app.use('/api/publico/pueblo/asistencia', seguridad.limitarPublico);
    app.use('/api/auth', crearAuthRouter({ db, config, verificarToken }));
    app.use('/api/publico/pueblo', crearPuebloPublicoRouter({ db }));

    // Protege por defecto todos los módulos operativos de la aplicación.
    app.use('/api/asistencias', verificarToken, crearAsistenciasRouter({ db, config }));
    app.use('/api/usuarios', verificarToken, crearUsuariosRouter({ db }));
    app.use('/api/miembros', verificarToken, crearMiembrosRouter({ db }));
    app.use('/api/grupos', verificarToken, crearGruposRouter({ db }));
    app.use('/api/categorias', verificarToken, crearCategoriasRouter({ db }));
    app.use('/api/pueblo', verificarToken, crearPuebloRouter({ db }));

    // Finaliza la tubería HTTP con respuestas uniformes para rutas y errores.
    app.use('/api', rutaNoEncontrada);
    app.use(manejarErrores);

    return app;
};

module.exports = { crearApp };
