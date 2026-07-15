/**
 * Rutas protegidas del módulo Pueblo
 * El acceso público equivalente se declara explícitamente en index.js.
 */
const { Router } = require('express');
// Informa categorías ausentes mediante el contrato de error compartido.
const { HttpError } = require('../utils/http-error');
// Valida filtros y registros antes de consultar o escribir en SQLite.
const { validarEntero, validarFecha, validarId, validarTexto } = require('../utils/validation');
const router = Router();

// Registra asistencia del pueblo para consumidores autenticados.
router.post('/asistencia', (req, res) => {
    const db = req.app.locals.db;
    const { categoria_id, fecha, cantidad, servicio } = req.body;
    // Normaliza el registro protegido con las mismas reglas del endpoint público.
    const categoriaId = validarId(categoria_id, 'categoria_id');
    const fechaNormalizada = validarFecha(fecha, 'fecha', true);
    const cantidadNormalizada = validarEntero(cantidad ?? 1, 'cantidad', {
        required: true,
        min: 1,
        max: 100000
    });
    const servicioNormalizado = validarTexto(servicio, 'servicio', { max: 80 });
    const categoriaActiva = db
        .prepare('SELECT id FROM categorias WHERE id = ? AND activo = 1')
        .get(categoriaId);
    if (!categoriaActiva) {
        throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'La categoría indicada no está disponible');
    }
    const result = db.prepare(`
        INSERT INTO asistencias (categoria_id, fecha, tipo, cantidad, servicio)
        VALUES (?, ?, 'pueblo', ?, ?)
    `).run(categoriaId, fechaNormalizada, cantidadNormalizada, servicioNormalizado);
    return res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// Obtiene reporte de asistencias del pueblo (requiere JWT, se protege en index.js)
router.get('/reportes', (req, res) => {
    const db = req.app.locals.db;
    const { fecha, categoria_id } = req.query;
    // Rechaza filtros mal formados en lugar de devolver listas vacías engañosas.
    const fechaNormalizada = validarFecha(fecha);
    const categoriaId = validarId(categoria_id, 'categoria_id', false);
    let sql = `
        SELECT a.*, c.nombre as categoria_nombre
        FROM asistencias a
        LEFT JOIN categorias c ON a.categoria_id = c.id
        WHERE a.tipo = 'pueblo'
    `;
    const params = [];
    if (fechaNormalizada) { sql += ' AND a.fecha = ?'; params.push(fechaNormalizada); }
    if (categoriaId) { sql += ' AND a.categoria_id = ?'; params.push(categoriaId); }
    sql += ' ORDER BY a.fecha DESC, c.nombre ASC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
});

module.exports = router;
