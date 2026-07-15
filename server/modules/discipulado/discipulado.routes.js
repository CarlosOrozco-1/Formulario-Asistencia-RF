/**
 * Rutas de discipulado que mapean HTTP a controladores.
 */
const { Router } = require('express');
const { crearDiscipuladoRepository } = require('./discipulado.repository');
const { crearDiscipuladoService } = require('./discipulado.service');
const { crearDiscipuladoController } = require('./discipulado.controller');

const crearController = (db) => crearDiscipuladoController(
    crearDiscipuladoService(crearDiscipuladoRepository(db))
);

const crearGruposRouter = ({ db }) => {
    const router = Router();
    const controller = crearController(db);
    router.get('/', controller.listGroups);
    router.post('/', controller.createGroup);
    router.put('/:id', controller.updateGroup);
    router.delete('/:id', controller.deleteGroup);
    return router;
};

const crearMiembrosRouter = ({ db }) => {
    const router = Router();
    const controller = crearController(db);
    router.get('/', controller.listMembers);
    router.post('/', controller.createMember);
    router.put('/:id', controller.updateMember);
    router.delete('/:id', controller.deleteMember);
    return router;
};

module.exports = { crearGruposRouter, crearMiembrosRouter };
