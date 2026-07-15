/**
 * Rutas de autenticación sin lógica de negocio o consultas SQL.
 */
const { Router } = require('express');
const { crearAuthRepository } = require('./auth.repository');
const { crearAuthService } = require('./auth.service');
const { crearAuthController } = require('./auth.controller');

// Compone las capas del módulo con dependencias explícitas.
const crearAuthRouter = ({ db, config, verificarToken }) => {
    const router = Router();
    const repository = crearAuthRepository(db);
    const service = crearAuthService({ repository, jwtSecret: config.jwtSecret });
    const controller = crearAuthController(service);

    router.post('/login', controller.login);
    router.get('/me', verificarToken, controller.getSession);
    return router;
};

module.exports = { crearAuthRouter };
