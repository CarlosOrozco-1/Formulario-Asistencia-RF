/**
 * Middleware de autenticación JWT
 * Verifica el token Bearer en el header Authorization.
 * Si es válido, inyecta req.usuario con los datos del usuario autenticado.
 */
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'asistencia-rf-secret-2026';

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
