/**
 * Repositorio de usuarios con consultas aisladas del transporte HTTP.
 */
const crearUsuariosRepository = (db) => ({
    list: () => db.prepare(
        'SELECT id, username, nombre, rol, activo, ultimo_acceso FROM usuarios'
    ).all(),
    create: ({ username, passwordHash, nombre, rol }) => db.prepare(`
        INSERT INTO usuarios (username, password_hash, nombre, rol)
        VALUES (?, ?, ?, ?)
    `).run(username, passwordHash, nombre, rol),
    update: ({ id, nombre, rol, activo }) => db.prepare(`
        UPDATE usuarios
        SET nombre = COALESCE(?, nombre),
            rol = COALESCE(?, rol),
            activo = COALESCE(?, activo)
        WHERE id = ?
    `).run(nombre, rol, activo, id),
    updatePassword: ({ id, passwordHash }) => db.prepare(
        'UPDATE usuarios SET password_hash = ? WHERE id = ?'
    ).run(passwordHash, id),
    deactivate: (id) => db.prepare(
        'UPDATE usuarios SET activo = 0 WHERE id = ?'
    ).run(id)
});

module.exports = { crearUsuariosRepository };
