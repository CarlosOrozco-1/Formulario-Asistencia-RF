/**
 * Rutas del módulo de asistencias compuestas con dependencias explícitas.
 */
const { Router } = require('express');
const { crearAsistenciasRepository } = require('./asistencias.repository');
const { crearAsistenciasService } = require('./asistencias.service');
const { crearAsistenciasController } = require('./asistencias.controller');

const crearAsistenciasRouter = ({ db, config }) => {
    const router = Router();
    const controller = crearAsistenciasController(
        crearAsistenciasService(crearAsistenciasRepository(db), config)
    );
    router.get('/resumen', controller.getSummary);
    router.put('/grupos/:grupoId', controller.replaceGroupAttendance);
    router.get('/', controller.list);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);
    return router;
};

module.exports = { crearAsistenciasRouter };
