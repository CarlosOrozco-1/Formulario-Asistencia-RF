/**
 * Rutas de asistencias
 * GET, POST, PUT, DELETE para el registro de asistencias
 */
const { Router } = require('express');
// Distingue asistencias y relaciones ausentes mediante errores controlados.
const { HttpError, validationError } = require('../utils/http-error');
// Normaliza filtros y cuerpos antes de construir sentencias SQL.
const {
    validarEntero,
    validarEnum,
    validarFecha,
    validarId,
    validarTexto
} = require('../utils/validation');
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
    // Valida filtros opcionales para no aceptar resultados vacíos causados por errores de formato.
    const fechaNormalizada = validarFecha(fecha);
    const tipoNormalizado = validarEnum(tipo, 'tipo', ['discipulado', 'pueblo']);
    const miembroId = validarId(miembro_id, 'miembro_id', false);
    let sql = 'SELECT * FROM asistencias WHERE 1=1';
    const params = [];
    if (fechaNormalizada) { sql += ' AND fecha = ?'; params.push(fechaNormalizada); }
    if (tipoNormalizado) { sql += ' AND tipo = ?'; params.push(tipoNormalizado); }
    if (miembroId) { sql += ' AND miembro_id = ?'; params.push(miembroId); }
    sql += ' ORDER BY fecha DESC';
    const rows = db.prepare(sql).all(...params);
    res.json(rows);
});

// Crear nueva asistencia
router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const {
        miembro_id,
        categoria_id,
        grupo_id,
        fecha,
        tipo,
        estado,
        cantidad,
        servicio,
        grupo_servidores
    } = req.body;
    // Normaliza los campos comunes y conserva relaciones opcionales como valores nulos.
    const miembroId = validarId(miembro_id, 'miembro_id', false);
    const categoriaId = validarId(categoria_id, 'categoria_id', false);
    const grupoId = validarId(grupo_id, 'grupo_id', false);
    const fechaNormalizada = validarFecha(fecha, 'fecha', true);
    const tipoNormalizado = validarEnum(tipo, 'tipo', ['discipulado', 'pueblo'], true);
    const estadoNormalizado = validarEnum(
        estado,
        'estado',
        ['presente', 'reportado', 'ausente']
    );
    const cantidadNormalizada = validarEntero(cantidad ?? 1, 'cantidad', {
        required: true,
        min: 1,
        max: 100000
    });
    const servicioNormalizado = validarTexto(servicio, 'servicio', { max: 80 });
    const servidoresNormalizado = validarTexto(
        grupo_servidores,
        'grupo_servidores',
        { max: 180 }
    );
    // Exige las relaciones que dan significado a cada tipo de asistencia.
    if (tipoNormalizado === 'discipulado' && (!miembroId || !estadoNormalizado)) {
        throw validationError(
            'miembro_id',
            'Discipulado requiere miembro_id y estado'
        );
    }
    if (tipoNormalizado === 'pueblo' && !categoriaId) {
        throw validationError('categoria_id', 'Pueblo requiere una categoría');
    }
    // Confirma que las relaciones activas coincidan con el tipo antes de crear el registro.
    if (tipoNormalizado === 'discipulado') {
        const miembro = db
            .prepare('SELECT id, grupo_id FROM miembros WHERE id = ? AND activo = 1')
            .get(miembroId);
        if (!miembro) {
            throw new HttpError(404, 'MEMBER_NOT_FOUND', 'El miembro no está disponible');
        }
        if (grupoId && miembro.grupo_id !== grupoId) {
            throw validationError('grupo_id', 'El miembro no pertenece al grupo indicado');
        }
    }
    if (tipoNormalizado === 'pueblo') {
        const categoria = db
            .prepare('SELECT id FROM categorias WHERE id = ? AND activo = 1')
            .get(categoriaId);
        if (!categoria) {
            throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'La categoría no está disponible');
        }
    }
    const result = db.prepare(`
        INSERT INTO asistencias (
            miembro_id, categoria_id, grupo_id, fecha, tipo, estado,
            cantidad, servicio, grupo_servidores, registrado_por
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        miembroId,
        categoriaId,
        grupoId,
        fechaNormalizada,
        tipoNormalizado,
        estadoNormalizado,
        cantidadNormalizada,
        servicioNormalizado,
        servidoresNormalizado,
        req.usuario.id
    );
    return res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// Actualizar asistencia
router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { estado, cantidad, servicio, grupo_servidores } = req.body;
    // Construye solo columnas permitidas para conservar los valores que el cliente omite.
    const updates = [];
    const params = [];
    if (estado !== undefined) {
        updates.push('estado = ?');
        params.push(validarEnum(estado, 'estado', ['presente', 'reportado', 'ausente']));
    }
    if (cantidad !== undefined) {
        updates.push('cantidad = ?');
        params.push(validarEntero(cantidad, 'cantidad', { required: true, min: 1, max: 100000 }));
    }
    if (servicio !== undefined) {
        updates.push('servicio = ?');
        params.push(validarTexto(servicio, 'servicio', { max: 80 }));
    }
    if (grupo_servidores !== undefined) {
        updates.push('grupo_servidores = ?');
        params.push(validarTexto(grupo_servidores, 'grupo_servidores', { max: 180 }));
    }
    if (!updates.length) {
        throw validationError('body', 'Debe incluir al menos un campo para actualizar');
    }
    const id = validarId(req.params.id);
    params.push(id);
    const result = db.prepare(`
        UPDATE asistencias SET ${updates.join(', ')} WHERE id = ?
    `).run(...params);
    if (!result.changes) {
        throw new HttpError(404, 'ATTENDANCE_NOT_FOUND', 'La asistencia no existe');
    }
    return res.json({ success: true });
});

// Eliminar asistencia
router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const id = validarId(req.params.id);
    const result = db.prepare('DELETE FROM asistencias WHERE id = ?').run(id);
    if (!result.changes) {
        throw new HttpError(404, 'ATTENDANCE_NOT_FOUND', 'La asistencia no existe');
    }
    return res.json({ success: true });
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
