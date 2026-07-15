/**
 * Middleware de autenticacion JWT
 * Verifica el token Bearer en el header Authorization.
 * Si es valido, inyecta req.usuario con los datos del usuario autenticado.
 * El secreto JWT debe definirse en la variable de entorno JWT_SECRET.
 */
const jwt = require('jsonwebtoken');
// Usa errores controlados para que autenticación comparta el contrato global de la API.
const { HttpError } = require('../utils/http-error');

// Valida que exista JWT_SECRET al cargar el modulo
if (!process.env.JWT_SECRET) {
  throw new Error(
    'Falta variable de entorno JWT_SECRET. Define JWT_SECRET en tu archivo .env',
  );
}
const SECRET = process.env.JWT_SECRET;

function verificarToken(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return next(new HttpError(401, 'AUTH_REQUIRED', 'Se requiere un token de acceso'));
    }
    try {
        const token = header.split(' ')[1];
        req.usuario = jwt.verify(token, SECRET);
        next();
    } catch (err) {
        return next(new HttpError(401, 'INVALID_TOKEN', 'El token es inválido o expiró'));
    }
}

function soloAdmin(req, res, next) {
    if (req.usuario.rol !== 'admin') {
        return next(new HttpError(403, 'FORBIDDEN', 'Se requiere el rol administrador'));
    }
    next();
}

module.exports = { verificarToken, soloAdmin };
