/**
 * Controladores HTTP del dominio de discipulado.
 */
const crearDiscipuladoController = (service) => ({
    listGroups: (req, res) => res.json(service.listGroups()),
    createGroup: (req, res) => res.status(201).json(service.createGroup(req.body)),
    updateGroup: (req, res) => res.json(service.updateGroup(req.params.id, req.body)),
    deleteGroup: (req, res) => res.json(service.deleteGroup(req.params.id)),
    listMembers: (req, res) => res.json(service.listMembers(req.query)),
    createMember: (req, res) => res.status(201).json(service.createMember(req.body)),
    updateMember: (req, res) => res.json(service.updateMember(req.params.id, req.body)),
    deleteMember: (req, res) => res.json(service.deleteMember(req.params.id))
});

module.exports = { crearDiscipuladoController };
