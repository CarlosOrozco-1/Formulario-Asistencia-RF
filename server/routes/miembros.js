/**
 * Rutas de miembros
 * CRUD de miembros con filtros por tipo y grupo_id
 */
const { Router } = require('express');
const router = Router();

// Listar miembros con filtros opcionales: tipo, grupo_id, activo
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const { tipo, grupo_id, activo } = req.query;
    let sql = 'SELECT * FROM miembros WHERE 1=1';
    const params = [];
    if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
    if (grupo_id) { sql += ' AND grupo_id = ?'; params.push(grupo_id); }
    if (activo !== undefined) { sql += ' AND activo = ?'; params.push(activo); }
    sql += ' ORDER BY orden ASC, nombre ASC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
});

// Crear miembro
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, tipo, grupo_id } = req.body;
    if (!nombre || !tipo) {
        return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    }
    const result = db.prepare(
        'INSERT INTO miembros (nombre, tipo, grupo_id) VALUES (?, ?, ?)'
    ).run(nombre, tipo, grupo_id || null);
    res.json({ success: true, id: result.lastInsertRowid });
});

// Actualizar miembro
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, grupo_id, activo, orden } = req.body;
    db.prepare(
        'UPDATE miembros SET nombre = COALESCE(?, nombre), grupo_id = ?, activo = COALESCE(?, activo), orden = COALESCE(?, orden) WHERE id = ?'
    ).run(nombre || null, grupo_id !== undefined ? grupo_id : null, activo !== undefined ? activo : null, orden !== undefined ? orden : null, req.params.id);
    res.json({ success: true });
});

// Eliminar miembro
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    db.prepare('DELETE FROM miembros WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;
