/**
 * Repositorio de autenticación: único acceso del módulo a la tabla usuarios.
 */
const crearAuthRepository = (db) => ({
    findActiveByUsername: (username) => db.prepare(
        'SELECT * FROM usuarios WHERE username = ? AND activo = 1'
    ).get(username),
    findActiveIdentityById: (id) => db.prepare(`
        SELECT id, username, nombre, rol
        FROM usuarios
        WHERE id = ? AND activo = 1
    `).get(id),
    updateLastAccess: (id, timestamp) => db.prepare(
        'UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?'
    ).run(timestamp, id)
});

module.exports = { crearAuthRepository };
