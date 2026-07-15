/**
 * Adaptadores HTTP del dominio Pueblo.
 */
const crearPuebloController = (service) => ({
    listCategories: (req, res) => res.json(service.listCategories()),
    createCategory: (req, res) => res.status(201).json(service.createCategory(req.body)),
    updateCategory: (req, res) => res.json(
        service.updateCategory(req.params.id, req.body)
    ),
    deactivateCategory: (req, res) => res.json(
        service.deactivateCategory(req.params.id)
    ),
    registerAttendance: (req, res) => res.status(201).json(
        service.registerAttendance(req.body)
    ),
    listReports: (req, res) => res.json(service.listReports(req.query))
});

module.exports = { crearPuebloController };
