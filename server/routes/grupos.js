/**
 * Rutas de grupos de discipulado
 * CRUD de grupos con su lugar/ubicacion
 */
const { Router } = require('express');
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
    if (!nombre) {
        return res.status(400).json({ error: 'Nombre del grupo es requerido' });
    }
    const result = db.prepare(
        'INSERT INTO grupos_discipulado (nombre, lugar) VALUES (?, ?)'
    ).run(nombre, lugar || null);
    res.json({ success: true, id: result.lastInsertRowid });
});

// Actualizar grupo
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, lugar, activo, orden } = req.body;
    db.prepare(
        'UPDATE grupos_discipulado SET nombre = COALESCE(?, nombre), lugar = COALESCE(?, lugar), activo = COALESCE(?, activo), orden = COALESCE(?, orden) WHERE id = ?'
    ).run(nombre || null, lugar || null, activo !== undefined ? activo : null, orden !== undefined ? orden : null, req.params.id);
    res.json({ success: true });
});

// Eliminar grupo
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    db.prepare('DELETE FROM grupos_discipulado WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;
