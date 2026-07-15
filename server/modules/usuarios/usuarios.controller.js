/**
 * Controladores HTTP del módulo de usuarios.
 */
const crearUsuariosController = (service) => ({
    list: (req, res) => res.json(service.list()),
    create: (req, res) => res.status(201).json(service.create(req.body)),
    update: (req, res) => res.json(service.update(req.params.id, req.body)),
    updatePassword: (req, res) => res.json(
        service.updatePassword(req.params.id, req.body)
    ),
    deactivate: (req, res) => res.json(service.deactivate(req.params.id))
});

module.exports = { crearUsuariosController };
