/**
 * Rutas de autenticación
 * POST /api/auth/login  →  Verifica credenciales y devuelve JWT
 */
const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Reutiliza la validación JWT para confirmar la sesión antes de devolver la identidad.
const { verificarToken } = require("../middleware/auth");
const router = Router();

// Secreto JWT: debe definirse en la variable de entorno JWT_SECRET.
// Si no esta definida, el servidor lanzara un error para evitar usar un secreto debil.
if (!process.env.JWT_SECRET) {
  throw new Error(
    "Falta variable de entorno JWT_SECRET. Define JWT_SECRET en tu archivo .env",
  );
}
const SECRET = process.env.JWT_SECRET;

// Devuelve la identidad vigente para restaurar la sesión después de recargar la SPA.
router.get("/me", verificarToken, (req, res) => {
  // Consulta el usuario para rechazar sesiones de cuentas eliminadas o desactivadas.
  const usuario = req.app.locals.db
    .prepare("SELECT id, username, nombre, rol FROM usuarios WHERE id = ? AND activo = 1")
    .get(req.usuario.id);

  // Invalida la sesión cuando el usuario del token ya no puede acceder al sistema.
  if (!usuario) {
    return res.status(401).json({ error: "La sesión ya no está disponible" });
  }

  // Entrega únicamente los datos necesarios para reconstruir el estado del frontend.
  return res.json({ usuario });
});

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
