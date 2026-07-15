/**
 * Repositorio SQLite del dominio Pueblo y sus categorías.
 */
const crearPuebloRepository = (db) => ({
    listCategories: () => db.prepare(
        'SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre ASC'
    ).all(),
    createCategory: (nombre) => db.prepare(
        'INSERT INTO categorias (nombre) VALUES (?)'
    ).run(nombre),
    updateCategory: ({ id, nombre, activo }) => db.prepare(`
        UPDATE categorias
        SET nombre = COALESCE(?, nombre), activo = COALESCE(?, activo)
        WHERE id = ?
    `).run(nombre, activo, id),
    deactivateCategory: (id) => db.prepare(
        'UPDATE categorias SET activo = 0 WHERE id = ?'
    ).run(id),
    findActiveCategory: (id) => db.prepare(
        'SELECT id FROM categorias WHERE id = ? AND activo = 1'
    ).get(id),
    createAttendance: ({ categoriaId, fecha, cantidad, servicio }) => db.prepare(`
        INSERT INTO asistencias (categoria_id, fecha, tipo, cantidad, servicio)
        VALUES (?, ?, 'pueblo', ?, ?)
    `).run(categoriaId, fecha, cantidad, servicio),
    listReports: ({ fecha, categoriaId }) => {
        let sql = `
            SELECT a.*, c.nombre AS categoria_nombre
            FROM asistencias a
            LEFT JOIN categorias c ON a.categoria_id = c.id
            WHERE a.tipo = 'pueblo'
        `;
        const params = [];
        if (fecha) { sql += ' AND a.fecha = ?'; params.push(fecha); }
        if (categoriaId) {
            sql += ' AND a.categoria_id = ?';
            params.push(categoriaId);
        }
        sql += ' ORDER BY a.fecha DESC, c.nombre ASC';
        return db.prepare(sql).all(...params);
    }
});

module.exports = { crearPuebloRepository };
