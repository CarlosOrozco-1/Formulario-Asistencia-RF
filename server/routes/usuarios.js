/**
 * Rutas de usuarios (solo admin)
 * CRUD completo de usuarios del sistema
 */
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { soloAdmin } = require('../middleware/auth');
const router = Router();

router.use(soloAdmin);

router.get('/', (req, res) => {
    const db = req.app.locals.db;
    const rows = db.prepare('SELECT id, username, nombre, rol, activo, ultimo_acceso FROM usuarios').all();
    res.json(rows);
});

router.post('/', (req, res) => {
    const db = req.app.locals.db;
    const { username, password, nombre, rol } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO usuarios (username, password_hash, nombre, rol) VALUES (?, ?, ?, ?)').run(username, hash, nombre, rol || 'user');
    res.json({ success: true, id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
    const db = req.app.locals.db;
    const { nombre, rol, activo } = req.body;
    db.prepare('UPDATE usuarios SET nombre = ?, rol = ?, activo = ? WHERE id = ?').run(nombre, rol, activo, req.params.id);
    res.json({ success: true });
});

router.put('/:id/password', (req, res) => {
    const db = req.app.locals.db;
    const hash = bcrypt.hashSync(req.body.password, 10);
    db.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
    res.json({ success: true });
});

router.delete('/:id', (req, res) => {
    const db = req.app.locals.db;
    db.prepare('UPDATE usuarios SET activo = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;
