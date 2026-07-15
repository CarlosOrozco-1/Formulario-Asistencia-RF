/**
 * Sistema de Asistencia RF - Servidor Express
 *
 * Orquestador del backend: sirve archivos estaticos y expone la API REST.
 * Escucha en el puerto definido por process.env.PORT o 3000 por defecto.
 */

// Carga las variables de entorno desde el archivo .env (debe ir al inicio)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { conectarDB } = require("./database/connection");
const authRoutes = require("./routes/auth");
const asistenciasRoutes = require("./routes/asistencias");
const usuariosRoutes = require("./routes/usuarios");
const miembrosRoutes = require("./routes/miembros");
const gruposRoutes = require("./routes/grupos");
const categoriasRoutes = require("./routes/categorias");
const puebloRoutes = require("./routes/pueblo");
const { verificarToken } = require("./middleware/auth");
// Centraliza errores y rutas API inexistentes para mantener un único contrato JSON.
const { manejarErrores, rutaNoEncontrada } = require("./middleware/error");
// Expresa recursos inexistentes sin construir respuestas ad hoc en el endpoint público.
const { HttpError } = require("./utils/http-error");
// Valida el endpoint público antes de permitir escrituras directas en la base de datos.
const {
  validarEntero,
  validarFecha,
  validarId,
  validarTexto,
} = require("./utils/validation");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware globales
app.use(cors());
app.use(express.json());

// Sirve los archivos estaticos del frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// Inicializa la base de datos SQLite y la pone a disposicion de las rutas
const db = conectarDB();
app.locals.db = db;

// Rutas publicas (sin JWT)
app.use("/api/auth", authRoutes);

// Endpoint publico para registro de asistencia del pueblo
// Cualquier persona puede registrar asistencia sin necesidad de login
app.post("/api/publico/pueblo/asistencia", (req, res) => {
  const db = req.app.locals.db;
  const { categoria_id, fecha, cantidad, servicio } = req.body;
  // Normaliza el cuerpo para rechazar referencias, fechas y cantidades inválidas.
  const categoriaId = validarId(categoria_id, "categoria_id");
  const fechaNormalizada = validarFecha(fecha, "fecha", true);
  const cantidadNormalizada = validarEntero(cantidad ?? 1, "cantidad", {
    required: true,
    min: 1,
    max: 100000,
  });
  const servicioNormalizado = validarTexto(servicio, "servicio", { max: 80 });
  // Impide registrar asistencia en una categoría inexistente o desactivada.
  const categoriaActiva = db
    .prepare("SELECT id FROM categorias WHERE id = ? AND activo = 1")
    .get(categoriaId);
  if (!categoriaActiva) {
    throw new HttpError(404, "CATEGORY_NOT_FOUND", "La categoría indicada no está disponible");
  }
  const result = db
    .prepare(
      `
        INSERT INTO asistencias (categoria_id, fecha, tipo, cantidad, servicio)
        VALUES (?, ?, 'pueblo', ?, ?)
    `,
    )
    .run(categoriaId, fechaNormalizada, cantidadNormalizada, servicioNormalizado);
  return res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// Rutas protegidas (requieren JWT valido)
app.use("/api/asistencias", verificarToken, asistenciasRoutes);
app.use("/api/usuarios", verificarToken, usuariosRoutes);
app.use("/api/miembros", verificarToken, miembrosRoutes);
app.use("/api/grupos", verificarToken, gruposRoutes);
app.use("/api/categorias", verificarToken, categoriasRoutes);
app.use("/api/pueblo", verificarToken, puebloRoutes);

// Responde las URLs de API desconocidas antes de delegar al manejador central.
app.use("/api", rutaNoEncontrada);
// Mantiene el middleware de errores al final para capturar fallos de todas las rutas.
app.use(manejarErrores);

// Inicia el servidor en el puerto configurado
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
