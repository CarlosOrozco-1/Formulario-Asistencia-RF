/**
 * Repositorio de grupos y miembros del dominio de discipulado.
 */
const crearDiscipuladoRepository = (db) => ({
    listGroups: () => db.prepare(`
        SELECT g.*,
               (SELECT COUNT(*) FROM miembros
                WHERE grupo_id = g.id AND activo = 1) AS total_miembros
        FROM grupos_discipulado g
        WHERE g.activo = 1
        ORDER BY g.orden ASC, g.nombre ASC
    `).all(),
    createGroup: ({ nombre, lugar }) => db.prepare(
        'INSERT INTO grupos_discipulado (nombre, lugar) VALUES (?, ?)'
    ).run(nombre, lugar),
    updateGroup: ({ id, nombre, lugar, activo, orden }) => db.prepare(`
        UPDATE grupos_discipulado
        SET nombre = COALESCE(?, nombre),
            lugar = COALESCE(?, lugar),
            activo = COALESCE(?, activo),
            orden = COALESCE(?, orden)
        WHERE id = ?
    `).run(nombre, lugar, activo, orden, id),
    deleteGroup: (id) => db.prepare(
        'DELETE FROM grupos_discipulado WHERE id = ?'
    ).run(id),
    listMembers: ({ tipo, grupoId, activo }) => {
        let sql = 'SELECT * FROM miembros WHERE 1=1';
        const params = [];
        if (tipo) { sql += ' AND tipo = ?'; params.push(tipo); }
        if (grupoId) { sql += ' AND grupo_id = ?'; params.push(grupoId); }
        if (activo !== null) { sql += ' AND activo = ?'; params.push(activo); }
        return db.prepare(`${sql} ORDER BY orden ASC, nombre ASC`).all(...params);
    },
    createMember: ({ nombre, tipo, grupoId }) => db.prepare(
        'INSERT INTO miembros (nombre, tipo, grupo_id) VALUES (?, ?, ?)'
    ).run(nombre, tipo, grupoId),
    updateMember: ({ id, nombre, hasGroupId, grupoId, activo, orden }) => db.prepare(`
        UPDATE miembros
        SET nombre = COALESCE(?, nombre),
            grupo_id = CASE WHEN ? = 1 THEN ? ELSE grupo_id END,
            activo = COALESCE(?, activo),
            orden = COALESCE(?, orden)
        WHERE id = ?
    `).run(nombre, hasGroupId ? 1 : 0, grupoId, activo, orden, id),
    deleteMember: (id) => db.prepare('DELETE FROM miembros WHERE id = ?').run(id)
});

module.exports = { crearDiscipuladoRepository };
