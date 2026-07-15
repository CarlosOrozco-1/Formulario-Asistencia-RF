/**
 * Rutas publicas del modulo Pueblo
 * Permite registrar asistencia sin autenticacion (POST)
 * Las rutas de reportes requieren JWT (se protegen desde index.js)
 */
const { Router } = require('express');
const router = Router();

// Registra asistencia del pueblo (acceso publico, sin JWT)
// Cualquier persona puede llenar este formulario
router.post('/asistencia', (req, res) => {
    const db = req.app.locals.db;
    const { categoria_id, fecha, cantidad, servicio } = req.body;
    if (!categoria_id || !fecha) {
        return res.status(400).json({ error: 'Categoria y fecha son requeridas' });
    }
    const result = db.prepare(`
        INSERT INTO asistencias (categoria_id, fecha, tipo, cantidad, servicio)
        VALUES (?, ?, 'pueblo', ?, ?)
    `).run(categoria_id, fecha, cantidad || 1, servicio || null);
    res.json({ success: true, id: result.lastInsertRowid });
});

// Obtiene reporte de asistencias del pueblo (requiere JWT, se protege en index.js)
router.get('/reportes', (req, res) => {
    const db = req.app.locals.db;
    const { fecha, categoria_id } = req.query;
    let sql = `
        SELECT a.*, c.nombre as categoria_nombre
        FROM asistencias a
        LEFT JOIN categorias c ON a.categoria_id = c.id
        WHERE a.tipo = 'pueblo'
    `;
    const params = [];
    if (fecha) { sql += ' AND a.fecha = ?'; params.push(fecha); }
    if (categoria_id) { sql += ' AND a.categoria_id = ?'; params.push(categoria_id); }
    sql += ' ORDER BY a.fecha DESC, c.nombre ASC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
});

module.exports = router;
