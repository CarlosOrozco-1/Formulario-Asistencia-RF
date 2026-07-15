/**
 * Rutas de autenticación
 * POST /api/auth/login  →  Verifica credenciales y devuelve JWT
 */
const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = Router();

// Secreto JWT: debe definirse en la variable de entorno JWT_SECRET.
// Si no esta definida, el servidor lanzara un error para evitar usar un secreto debil.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "Falta variable de entorno JWT_SECRET. Define JWT_SECRET en tu archivo .env",
  );
}
const SECRET = process.env.JWT_SECRET;

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña requeridos" });
  }
  const db = req.app.locals.db;
  const row = db
    .prepare("SELECT * FROM usuarios WHERE username = ? AND activo = 1")
    .get(username);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  db.prepare("UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?").run(
    new Date().toISOString(),
    row.id,
  );
  const token = jwt.sign(
    { id: row.id, username: row.username, rol: row.rol, nombre: row.nombre },
    SECRET,
    { expiresIn: "24h" },
  );
  res.json({
    token,
    usuario: { id: row.id, nombre: row.nombre, rol: row.rol },
  });
});

module.exports = router;
