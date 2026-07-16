-- ============================================
-- Script de Inicialización de Base de Datos
-- Gestión de Asistencia
-- Motor: SQLite (SQL.js en navegador)
-- ============================================

-- Tabla de usuarios del sistema
-- Almacena credenciales y roles para acceso a la aplicación
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT DEFAULT 'user',
    activo INTEGER DEFAULT 1,
    ultimo_acceso TEXT
);

-- Tabla de miembros (unifica discipulado y pueblo)
-- tipo: 'discipulado' | 'pueblo'
CREATE TABLE IF NOT EXISTS miembros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    activo INTEGER DEFAULT 1,
    orden INTEGER DEFAULT 0
);

-- Tabla de categorías/departamentos del pueblo
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    activo INTEGER DEFAULT 1
);

-- Tabla única de registro de asistencias
-- miembro_id: NULL si es asistencia de categoría (pueblo)
-- categoria_id: NULL si es asistencia de miembro (discipulado)
CREATE TABLE IF NOT EXISTS asistencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    miembro_id INTEGER,
    categoria_id INTEGER,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL,
    estado TEXT,
    cantidad INTEGER DEFAULT 1,
    servicio TEXT,
    grupo_servidores TEXT,
    registrado_por INTEGER,
    FOREIGN KEY (miembro_id) REFERENCES miembros(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_tipo ON asistencias(tipo);
CREATE INDEX IF NOT EXISTS idx_asistencias_miembro ON asistencias(miembro_id);
CREATE INDEX IF NOT EXISTS idx_miembros_tipo ON miembros(tipo);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);

-- Usuario administrador por defecto
-- Contraseña: admin123 (debe cambiarse en producción)
INSERT OR IGNORE INTO usuarios (username, password_hash, nombre, rol)
VALUES ('admin', 'admin123', 'Administrador', 'admin');
