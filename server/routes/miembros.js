/**
 * Rutas de miembros
 * CRUD de miembros con filtros por tipo y grupo_id
 */
const { Router } = require('express');
// Expresa miembros ausentes y cuerpos vacíos mediante el contrato HTTP oficial.
const { HttpError, validationError } = require('../utils/http-error');
// Valida filtros y datos del miembro antes de componer consultas.
const {
    validarBooleano,
    validarEntero,
    validarEnum,
    validarId,
    validarTexto
} = require('../utils/validation');
const router = Router();

// Listar miembros con filtros opcionales: tipo, grupo_id, activo
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const { tipo, grupo_id, activo } = req.query;
    // Normaliza los filtros para evitar comparaciones silenciosas con valores inválidos.
    const tipoNormalizado = validarEnum(tipo, 'tipo', ['discipulado', 'pueblo']);
    const grupoId = validarId(grupo_id, 'grupo_id', false);
    const activoNormalizado = validarBooleano(activo, 'activo');
    let sql = 'SELECT * FROM miembros WHERE 1=1';
    const params = [];
    if (tipoNormalizado) { sql += ' AND tipo = ?'; params.push(tipoNormalizado); }
    if (grupoId) { sql += ' AND grupo_id = ?'; params.push(grupoId); }
    if (activoNormalizado !== null) {
        sql += ' AND activo = ?';
        params.push(activoNormalizado);
    }
    sql += ' ORDER BY orden ASC, nombre ASC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
});

// Crear miembro
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, tipo, grupo_id } = req.body;
    // Requiere los datos esenciales y normaliza la relación opcional con discipulado.
    const nombreNormalizado = validarTexto(nombre, 'nombre', { required: true, max: 150 });
    const tipoNormalizado = validarEnum(tipo, 'tipo', ['discipulado', 'pueblo'], true);
    const grupoId = validarId(grupo_id, 'grupo_id', false);
    const result = db.prepare(
        'INSERT INTO miembros (nombre, tipo, grupo_id) VALUES (?, ?, ?)'
    ).run(nombreNormalizado, tipoNormalizado, grupoId);
    return res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// Actualizar miembro
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, grupo_id, activo, orden } = req.body;
    // Distingue entre omitir grupo_id y enviarlo como null para retirar la relación.
    const tieneGrupoId = Object.prototype.hasOwnProperty.call(req.body, 'grupo_id');
    if ([nombre, activo, orden].every(value => value === undefined) && !tieneGrupoId) {
        throw validationError('body', 'Debe incluir al menos un campo para actualizar');
    }
    const id = validarId(req.params.id);
    const nombreNormalizado = validarTexto(nombre, 'nombre', {
        required: nombre !== undefined,
        max: 150
    });
    const grupoId = grupo_id === null ? null : validarId(grupo_id, 'grupo_id', false);
    const activoNormalizado = validarBooleano(activo, 'activo');
    const ordenNormalizado = validarEntero(orden, 'orden', { min: 0, max: 10000 });
    const result = db.prepare(`
        UPDATE miembros
        SET nombre = COALESCE(?, nombre),
            grupo_id = CASE WHEN ? = 1 THEN ? ELSE grupo_id END,
            activo = COALESCE(?, activo),
            orden = COALESCE(?, orden)
        WHERE id = ?
    `).run(
        nombreNormalizado,
        tieneGrupoId ? 1 : 0,
        grupoId,
        activoNormalizado,
        ordenNormalizado,
        id
    );
    if (!result.changes) throw new HttpError(404, 'MEMBER_NOT_FOUND', 'El miembro no existe');
    return res.json({ success: true });
});

// Eliminar miembro
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const id = validarId(req.params.id);
    const result = db.prepare('DELETE FROM miembros WHERE id = ?').run(id);
    if (!result.changes) throw new HttpError(404, 'MEMBER_NOT_FOUND', 'El miembro no existe');
    return res.json({ success: true });
});

module.exports = router;
