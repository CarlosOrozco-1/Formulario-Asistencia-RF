/**
 * Rutas de categorias del pueblo
 * CRUD de categorias/departamentos (Danza, Cafeteria, etc.)
 */
const { Router } = require('express');
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
    if (!nombre) {
        return res.status(400).json({ error: 'Nombre de categoria requerido' });
    }
    try {
        const result = db.prepare(
            'INSERT INTO categorias (nombre) VALUES (?)'
        ).run(nombre);
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        // Error por nombre duplicado (UNIQUE constraint)
        res.status(400).json({ error: 'Ya existe una categoria con ese nombre' });
    }
});

// Actualiza una categoria
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, activo } = req.body;
    db.prepare(
        'UPDATE categorias SET nombre = COALESCE(?, nombre), activo = COALESCE(?, activo) WHERE id = ?'
    ).run(nombre || null, activo !== undefined ? activo : null, req.params.id);
    res.json({ success: true });
});

// Elimina (desactiva) una categoria
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    db.prepare('UPDATE categorias SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;
