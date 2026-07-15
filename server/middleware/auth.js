/**
 * Middleware de autenticacion JWT
 * Verifica el token Bearer en el header Authorization.
 * Si es valido, inyecta req.usuario con los datos del usuario autenticado.
 * El secreto JWT debe definirse en la variable de entorno JWT_SECRET.
 */
const jwt = require('jsonwebtoken');

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
        return res.status(401).json({ error: 'Token requerido' });
    }
    try {
        const token = header.split(' ')[1];
        req.usuario = jwt.verify(token, SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

function soloAdmin(req, res, next) {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado: se requiere rol admin' });
    }
    next();
}

module.exports = { verificarToken, soloAdmin };
