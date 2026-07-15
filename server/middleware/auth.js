/**
 * Middleware de autenticación y autorización independiente de variables globales.
 */
const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/http-error');

// Construye la verificación con un secreto inyectado desde la configuración validada.
const crearMiddlewareAuth = (secret) => {
    const verificarToken = (req, res, next) => {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return next(new HttpError(401, 'AUTH_REQUIRED', 'Se requiere un token de acceso'));
        }
        try {
            const token = header.split(' ')[1];
            req.usuario = jwt.verify(token, secret);
            return next();
        } catch (error) {
            return next(new HttpError(401, 'INVALID_TOKEN', 'El token es inválido o expiró'));
        }
    };

    return { verificarToken };
};

// Restringe casos de uso administrativos después de autenticar la identidad.
const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'admin') {
        return next(new HttpError(403, 'FORBIDDEN', 'Se requiere el rol administrador'));
    }
    return next();
};

module.exports = { crearMiddlewareAuth, soloAdmin };
