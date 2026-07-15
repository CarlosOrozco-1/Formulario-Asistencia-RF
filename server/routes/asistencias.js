/**
 * Rutas de asistencias
 * GET, POST, PUT, DELETE para el registro de asistencias
 */
const { Router } = require('express');
const router = Router();
// Mantiene los cortes diarios alineados con la zona horaria donde opera la congregación.
const ZONA_HORARIA = process.env.BUSINESS_TIME_ZONE || 'America/Mexico_City';

// Obtiene una fecha ISO local sin convertir primero el instante a UTC.
const obtenerFechaNegocio = () => new Intl.DateTimeFormat('fr-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).format(new Date());

// Obtener asistencias (con filtros opcionales: fecha, tipo, miembro_id)
router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const { fecha, tipo, miembro_id } = req.query;
    let sql = 'SELECT * FROM asistencias WHERE 1=1';
    const params = [];
    if (fecha) { sql += ' AND fecha = ?'; params.push(fecha); }
    if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
    if (miembro_id) { sql += ' AND miembro_id = ?'; params.push(miembro_id); }
    sql += ' ORDER BY fecha DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
});

// Crear nueva asistencia
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { miembro_id, categoria_id, fecha, tipo, estado, cantidad, servicio, grupo_servidores } = req.body;
    const result = db.prepare(`
        INSERT INTO asistencias (miembro_id, categoria_id, fecha, tipo, estado, cantidad, servicio, grupo_servidores, registrado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(miembro_id || null, categoria_id || null, fecha, tipo, estado || null, cantidad || 1, servicio || null, grupo_servidores || null, req.usuario.id);
    res.json({ success: true, id: result.lastInsertRowid });
});

// Actualizar asistencia
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { estado, cantidad, servicio, grupo_servidores } = req.body;
    db.prepare(`
        UPDATE asistencias SET estado = ?, cantidad = ?, servicio = ?, grupo_servidores = ? WHERE id = ?
    `).run(estado || null, cantidad || 1, servicio || null, grupo_servidores || null, req.params.id);
    res.json({ success: true });
});

// Eliminar asistencia
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    db.prepare('DELETE FROM asistencias WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Resumen completo para dashboard
router.get('/resumen', (req, res) => {
    const db = req.app.locals.db;
    const hoy = obtenerFechaNegocio();

    // Total de asistencias registradas hoy
    const asistenciasHoy = db.prepare(
        "SELECT COUNT(*) as total FROM asistencias WHERE fecha = ?"
    ).get(hoy);

    // Asistencias de hoy desglosadas por tipo
    const asistenciasPorTipo = db.prepare(
        "SELECT tipo, COUNT(*) as total FROM asistencias WHERE fecha = ? GROUP BY tipo"
    ).all(hoy);

    // Total de miembros activos
    const totalMiembros = db.prepare(
        "SELECT COUNT(*) as total FROM miembros WHERE activo = 1"
    ).get();

    // Miembros por tipo
    const miembrosPorTipo = db.prepare(
        "SELECT tipo, COUNT(*) as total FROM miembros WHERE activo = 1 GROUP BY tipo"
    ).all();

    // Grupos de discipulado activos con su total de miembros
    const grupos = db.prepare(
        "SELECT g.id, g.nombre, g.lugar, (SELECT COUNT(*) FROM miembros WHERE grupo_id = g.id AND activo = 1) as miembros_count FROM grupos_discipulado g WHERE g.activo = 1 ORDER BY g.orden ASC"
    ).all();

    // Categorias de pueblo activas
    const categorias = db.prepare(
        "SELECT id, nombre FROM categorias WHERE activo = 1 ORDER BY nombre ASC"
    ).all();

    res.json({
        asistenciasHoy: asistenciasHoy.total,
        asistenciasPorTipo,
        totalMiembros: totalMiembros.total,
        miembrosPorTipo,
        grupos,
        categorias
    });
});

module.exports = router;
