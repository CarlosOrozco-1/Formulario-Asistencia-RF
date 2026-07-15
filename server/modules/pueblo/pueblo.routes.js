/**
 * Composición de rutas públicas, protegidas y categorías del dominio Pueblo.
 */
const { Router } = require('express');
const { crearPuebloRepository } = require('./pueblo.repository');
const { crearPuebloService } = require('./pueblo.service');
const { crearPuebloController } = require('./pueblo.controller');

// Construye una sola implementación para evitar reglas duplicadas entre rutas.
const crearController = (db) => crearPuebloController(
    crearPuebloService(crearPuebloRepository(db))
);

const crearCategoriasRouter = ({ db }) => {
    const router = Router();
    const controller = crearController(db);
    router.get('/', controller.listCategories);
    router.post('/', controller.createCategory);
    router.put('/:id', controller.updateCategory);
    router.delete('/:id', controller.deactivateCategory);
    return router;
};

const crearPuebloPublicoRouter = ({ db }) => {
    const router = Router();
    const controller = crearController(db);
    router.post('/asistencia', controller.registerAttendance);
    return router;
};

const crearPuebloRouter = ({ db }) => {
    const router = Router();
    const controller = crearController(db);
    router.post('/asistencia', controller.registerAttendance);
    router.get('/reportes', controller.listReports);
    return router;
};

module.exports = {
    crearCategoriasRouter,
    crearPuebloPublicoRouter,
    crearPuebloRouter
};
