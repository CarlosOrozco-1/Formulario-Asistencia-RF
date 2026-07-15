/**
 * Rutas administrativas de usuarios.
 */
const { Router } = require('express');
const { soloAdmin } = require('../../middleware/auth');
const { crearUsuariosRepository } = require('./usuarios.repository');
const { crearUsuariosService } = require('./usuarios.service');
const { crearUsuariosController } = require('./usuarios.controller');

const crearUsuariosRouter = ({ db }) => {
    const router = Router();
    const controller = crearUsuariosController(
        crearUsuariosService(crearUsuariosRepository(db))
    );

    router.use(soloAdmin);
    router.get('/', controller.list);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.put('/:id/password', controller.updatePassword);
    router.delete('/:id', controller.deactivate);
    return router;
};

module.exports = { crearUsuariosRouter };
