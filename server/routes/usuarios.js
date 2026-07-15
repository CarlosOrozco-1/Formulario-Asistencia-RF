/**
 * Rutas de usuarios (solo admin)
 * CRUD completo de usuarios del sistema
 */
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { soloAdmin } = require('../middleware/auth');
// Distingue usuarios ausentes y datos inválidos con códigos HTTP estables.
const { HttpError, validationError } = require('../utils/http-error');
// Normaliza identidad, rol y estado antes de calcular hashes o persistir cambios.
const {
    validarBooleano,
    validarEnum,
    validarId,
    validarTexto
} = require('../utils/validation');
const router = Router();

router.use(soloAdmin);

router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare(
        'SELECT id, username, nombre, rol, activo, ultimo_acceso FROM usuarios'
    ).all();
    res.json(rows);
});

router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { username, password, nombre, rol } = req.body;
    // Valida los campos obligatorios antes de ejecutar una operación criptográfica costosa.
    const usernameNormalizado = validarTexto(username, 'username', { required: true, max: 80 });
    const passwordNormalizado = validarTexto(password, 'password', {
        required: true,
        max: 200,
        trim: false
    });
    if (passwordNormalizado.length < 8) {
        throw validationError('password', 'Debe contener al menos 8 caracteres');
    }
    const nombreNormalizado = validarTexto(nombre, 'nombre', { required: true, max: 150 });
    const rolNormalizado = validarEnum(rol ?? 'user', 'rol', ['user', 'admin'], true);
    const hash = bcrypt.hashSync(passwordNormalizado, 10);
    const result = db.prepare(`
        INSERT INTO usuarios (username, password_hash, nombre, rol)
        VALUES (?, ?, ?, ?)
    `).run(usernameNormalizado, hash, nombreNormalizado, rolNormalizado);
    return res.status(201).json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, rol, activo } = req.body;
    // Preserva los campos omitidos para impedir que una edición parcial los convierta en NULL.
    if ([nombre, rol, activo].every(value => value === undefined)) {
        throw validationError('body', 'Debe incluir al menos un campo para actualizar');
    }
    const id = validarId(req.params.id);
    const nombreNormalizado = validarTexto(nombre, 'nombre', {
        required: nombre !== undefined,
        max: 150
    });
    const rolNormalizado = validarEnum(rol, 'rol', ['user', 'admin']);
    const activoNormalizado = validarBooleano(activo, 'activo');
    const result = db.prepare(`
        UPDATE usuarios
        SET nombre = COALESCE(?, nombre),
            rol = COALESCE(?, rol),
            activo = COALESCE(?, activo)
        WHERE id = ?
    `).run(nombreNormalizado, rolNormalizado, activoNormalizado, id);
    if (!result.changes) throw new HttpError(404, 'USER_NOT_FOUND', 'El usuario no existe');
    return res.json({ success: true });
});

router.put('/:id/password', (req, res) => {
    const db = req.app.locals.db;
    const id = validarId(req.params.id);
    const password = validarTexto(req.body.password, 'password', {
        required: true,
        max: 200,
        trim: false
    });
    if (password.length < 8) {
        throw validationError('password', 'Debe contener al menos 8 caracteres');
    }
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hash, id);
    if (!result.changes) throw new HttpError(404, 'USER_NOT_FOUND', 'El usuario no existe');
    return res.json({ success: true });
});

router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    const id = validarId(req.params.id);
    const result = db.prepare('UPDATE usuarios SET activo = 0 WHERE id = ?').run(id);
    if (!result.changes) throw new HttpError(404, 'USER_NOT_FOUND', 'El usuario no existe');
    return res.json({ success: true });
});

module.exports = router;
