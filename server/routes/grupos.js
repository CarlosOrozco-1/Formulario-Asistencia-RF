/**
 * Rutas de grupos de discipulado
 * CRUD de grupos con su lugar/ubicacion
 */
const { Router } = require('express');
// Distingue grupos inexistentes de solicitudes inválidas mediante errores controlados.
const { HttpError, validationError } = require('../utils/http-error');
// Normaliza los campos aceptados antes de acceder a SQLite.
const {
    validarBooleano,
    validarEntero,
    validarId,
    validarTexto
} = require('../utils/validation');
const router = Router();

// Listar todos los grupos activos
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare(
        'SELECT g.*, (SELECT COUNT(*) FROM miembros WHERE grupo_id = g.id AND activo = 1) as total_miembros FROM grupos_discipulado g WHERE g.activo = 1 ORDER BY g.orden ASC, g.nombre ASC'
    ).all();
    res.json(rows);
});

// Crear grupo
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, lugar } = req.body;
    // Conserva nombres obligatorios y ubicaciones opcionales dentro de límites conocidos.
    const nombreNormalizado = validarTexto(nombre, 'nombre', { required: true, max: 120 });
    const lugarNormalizado = validarTexto(lugar, 'lugar', { max: 180 });
    const result = db.prepare(
        'INSERT INTO grupos_discipulado (nombre, lugar) VALUES (?, ?)'
    ).run(nombreNormalizado, lugarNormalizado);
    return res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// Actualizar grupo
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, lugar, activo, orden } = req.body;
    // Impide solicitudes sin cambios porque suelen indicar un error del consumidor.
    if ([nombre, lugar, activo, orden].every(value => value === undefined)) {
        throw validationError('body', 'Debe incluir al menos un campo para actualizar');
    }
    const id = validarId(req.params.id);
    const nombreNormalizado = validarTexto(nombre, 'nombre', {
        required: nombre !== undefined,
        max: 120
    });
    const lugarNormalizado = validarTexto(lugar, 'lugar', { max: 180 });
    const activoNormalizado = validarBooleano(activo, 'activo');
    const ordenNormalizado = validarEntero(orden, 'orden', { min: 0, max: 10000 });
    const result = db.prepare(
        'UPDATE grupos_discipulado SET nombre = COALESCE(?, nombre), lugar = COALESCE(?, lugar), activo = COALESCE(?, activo), orden = COALESCE(?, orden) WHERE id = ?'
    ).run(nombreNormalizado, lugarNormalizado, activoNormalizado, ordenNormalizado, id);
    if (!result.changes) throw new HttpError(404, 'GROUP_NOT_FOUND', 'El grupo no existe');
    return res.json({ success: true });
});

// Eliminar grupo
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const id = validarId(req.params.id);
    const result = db.prepare('DELETE FROM grupos_discipulado WHERE id = ?').run(id);
    if (!result.changes) throw new HttpError(404, 'GROUP_NOT_FOUND', 'El grupo no existe');
    return res.json({ success: true });
});

module.exports = router;
