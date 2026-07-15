/**
 * Repositorio SQLite de asistencias y consultas del tablero.
 */
const crearAsistenciasRepository = (db) => ({
    list: ({ fecha, tipo, miembroId }) => {
        let sql = 'SELECT * FROM asistencias WHERE 1=1';
        const params = [];
        if (fecha) { sql += ' AND fecha = ?'; params.push(fecha); }
        if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
        if (miembroId) { sql += ' AND miembro_id = ?'; params.push(miembroId); }
        sql += ' ORDER BY fecha DESC';
        return db.prepare(sql).all(...params);
    },
    findActiveMember: (id) => db.prepare(
        'SELECT id, grupo_id FROM miembros WHERE id = ? AND activo = 1'
    ).get(id),
    findActiveCategory: (id) => db.prepare(
        'SELECT id FROM categorias WHERE id = ? AND activo = 1'
    ).get(id),
    findActiveGroup: (id) => db.prepare(
        'SELECT id FROM grupos_discipulado WHERE id = ? AND activo = 1'
    ).get(id),
    listActiveGroupMembers: (grupoId) => db.prepare(`
        SELECT id FROM miembros
        WHERE grupo_id = ? AND tipo = 'discipulado' AND activo = 1
        ORDER BY id ASC
    `).all(grupoId),
    create: (attendance) => db.prepare(`
        INSERT INTO asistencias (
            miembro_id, categoria_id, grupo_id, fecha, tipo, estado,
            cantidad, servicio, grupo_servidores, registrado_por
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        attendance.miembroId,
        attendance.categoriaId,
        attendance.grupoId,
        attendance.fecha,
        attendance.tipo,
        attendance.estado,
        attendance.cantidad,
        attendance.servicio,
        attendance.grupoServidores,
        attendance.registradoPor
    ),
    update: ({ id, updates }) => {
        const assignments = updates.map(update => `${update.column} = ?`);
        const values = updates.map(update => update.value);
        values.push(id);
        return db.prepare(`
            UPDATE asistencias SET ${assignments.join(', ')} WHERE id = ?
        `).run(...values);
    },
    delete: (id) => db.prepare('DELETE FROM asistencias WHERE id = ?').run(id),
    replaceGroupAttendance: db.transaction((data) => {
        // Reemplaza la lista completa dentro de una transacción para evitar guardados parciales.
        db.prepare(`
            DELETE FROM asistencias
            WHERE fecha = ? AND tipo = 'discipulado'
              AND (
                  grupo_id = ? OR miembro_id IN (
                      SELECT id FROM miembros WHERE grupo_id = ?
                  )
              )
        `).run(data.fecha, data.grupoId, data.grupoId);
        const insert = db.prepare(`
            INSERT INTO asistencias (
                miembro_id, grupo_id, fecha, tipo, estado, registrado_por
            )
            VALUES (?, ?, ?, 'discipulado', ?, ?)
        `);
        data.asistencias.forEach(attendance => {
            insert.run(
                attendance.miembroId,
                data.grupoId,
                data.fecha,
                attendance.estado,
                data.registradoPor
            );
        });
        return data.asistencias.length;
    }),
    getSummary: (fecha) => ({
        asistenciasHoy: db.prepare(
            'SELECT COUNT(*) AS total FROM asistencias WHERE fecha = ?'
        ).get(fecha).total,
        asistenciasPorTipo: db.prepare(`
            SELECT tipo, COUNT(*) AS total
            FROM asistencias WHERE fecha = ? GROUP BY tipo
        `).all(fecha),
        totalMiembros: db.prepare(
            'SELECT COUNT(*) AS total FROM miembros WHERE activo = 1'
        ).get().total,
        miembrosPorTipo: db.prepare(`
            SELECT tipo, COUNT(*) AS total
            FROM miembros WHERE activo = 1 GROUP BY tipo
        `).all(),
        grupos: db.prepare(`
            SELECT g.id, g.nombre, g.lugar,
                   (SELECT COUNT(*) FROM miembros
                    WHERE grupo_id = g.id AND activo = 1) AS miembros_count
            FROM grupos_discipulado g
            WHERE g.activo = 1
            ORDER BY g.orden ASC
        `).all(),
        categorias: db.prepare(`
            SELECT id, nombre FROM categorias
            WHERE activo = 1 ORDER BY nombre ASC
        `).all()
    })
});

module.exports = { crearAsistenciasRepository };
