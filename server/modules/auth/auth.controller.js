/**
 * Controladores HTTP de autenticación: adaptan solicitudes a casos de uso.
 */
const crearAuthController = (service) => ({
    login: (req, res) => res.json(service.login(req.body)),
    getSession: (req, res) => res.json(service.getSession(req.usuario))
});

module.exports = { crearAuthController };
