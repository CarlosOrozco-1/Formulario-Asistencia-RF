-- Schema SQL para Gestión de Asistencia
-- Ejecutado por better-sqlite3 al iniciar el servidor
-- Ver documentacion completa en docs/db-schema.md

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT DEFAULT 'user',
    activo INTEGER DEFAULT 1,
    ultimo_acceso TEXT
);

CREATE TABLE IF NOT EXISTS grupos_discipulado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    lugar TEXT,
    activo INTEGER DEFAULT 1,
    orden INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS miembros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    grupo_id INTEGER,
    activo INTEGER DEFAULT 1,
    orden INTEGER DEFAULT 0,
    FOREIGN KEY (grupo_id) REFERENCES grupos_discipulado(id)
);

CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS asistencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    miembro_id INTEGER,
    categoria_id INTEGER,
    grupo_id INTEGER,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL,
    estado TEXT,
    cantidad INTEGER DEFAULT 1,
    servicio TEXT,
    grupo_servidores TEXT,
    registrado_por INTEGER,
    FOREIGN KEY (miembro_id) REFERENCES miembros(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (grupo_id) REFERENCES grupos_discipulado(id),
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- Indices para rendimiento
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_tipo ON asistencias(tipo);
CREATE INDEX IF NOT EXISTS idx_asistencias_miembro ON asistencias(miembro_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_grupo ON asistencias(grupo_id);
CREATE INDEX IF NOT EXISTS idx_miembros_tipo ON miembros(tipo);
CREATE INDEX IF NOT EXISTS idx_miembros_grupo ON miembros(grupo_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);

-- Usuario administrador por defecto (contrasena: admin123)
INSERT OR IGNORE INTO usuarios (username, password_hash, nombre, rol)
VALUES ('admin', '$2a$10$w5V2XuL5g2HCs1wgAlVmpu0UbtKeSi2GbdgCwJMpL0aYdGiFPKAJG', 'Administrador', 'admin');
