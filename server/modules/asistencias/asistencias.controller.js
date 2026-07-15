/**
 * Adaptadores HTTP del módulo de asistencias.
 */
const crearAsistenciasController = (service) => ({
    list: (req, res) => res.json(service.list(req.query)),
    create: (req, res) => res.status(201).json(
        service.create(req.body, req.usuario.id)
    ),
    update: (req, res) => res.json(service.update(req.params.id, req.body)),
    delete: (req, res) => res.json(service.delete(req.params.id)),
    replaceGroupAttendance: (req, res) => res.json(
        service.replaceGroupAttendance(req.params.grupoId, req.body, req.usuario.id)
    ),
    getSummary: (req, res) => res.json(service.getSummary())
});

module.exports = { crearAsistenciasController };
