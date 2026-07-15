/**
 * Rutas de categorias del pueblo
 * CRUD de categorias/departamentos (Danza, Cafeteria, etc.)
 */
const { Router } = require('express');
// Usa errores controlados para distinguir recursos ausentes de solicitudes inválidas.
const { HttpError, validationError } = require('../utils/http-error');
// Normaliza texto, identificadores y estado antes de ejecutar el CRUD.
const { validarBooleano, validarId, validarTexto } = require('../utils/validation');
const router = Router();

// Lista todas las categorias activas
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare(
        'SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre ASC'
    ).all();
    res.json(rows);
});

// Crea una nueva categoria
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { nombre } = req.body;
    // Evita categorías vacías y limita el texto almacenado.
    const nombreNormalizado = validarTexto(nombre, 'nombre', { required: true, max: 120 });
    const result = db.prepare(
        'INSERT INTO categorias (nombre) VALUES (?)'
    ).run(nombreNormalizado);
    return res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// Actualiza una categoria
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, activo } = req.body;
    // Requiere al menos un cambio para impedir actualizaciones vacías ambiguas.
    if (nombre === undefined && activo === undefined) {
        throw validationError('body', 'Debe incluir nombre o activo');
    }
    const id = validarId(req.params.id);
    const nombreNormalizado = validarTexto(nombre, 'nombre', {
        required: nombre !== undefined,
        max: 120
    });
    const activoNormalizado = validarBooleano(activo, 'activo');
    const result = db.prepare(
        'UPDATE categorias SET nombre = COALESCE(?, nombre), activo = COALESCE(?, activo) WHERE id = ?'
    ).run(nombreNormalizado, activoNormalizado, id);
    if (!result.changes) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'La categoría no existe');
    return res.json({ success: true });
});

// Elimina (desactiva) una categoria
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const id = validarId(req.params.id);
    const result = db.prepare('UPDATE categorias SET activo = 0 WHERE id = ?').run(id);
    if (!result.changes) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'La categoría no existe');
    return res.json({ success: true });
});

module.exports = router;
