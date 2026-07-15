# Esquema de Base de Datos

## Vision General

Base de datos SQLite server-side gestionada por better-sqlite3. El archivo `asistencias.db` reside en `server/database/`.

## Modelo Relacional

```
┌────────────────────┐
│     usuarios       │
├────────────────────┤
│ id (PK)            │──┐
│ username (UNIQUE)  │  │
│ password_hash      │  │
│ nombre             │  │
│ rol                │  │
│ activo             │  │
│ ultimo_acceso      │  │
└────────────────────┘  │
                        │
┌────────────────────┐  │       ┌──────────────────────────┐
│ grupos_discipulado │  │       │      asistencias          │
├────────────────────┤  │       ├──────────────────────────┤
│ id (PK)            │  │       │ id (PK)                  │
│ nombre             │  │       │ miembro_id (FK)           │──┤
│ lugar              │  │       │ categoria_id (FK)         │  │
│ activo             │  │       │ grupo_id (FK)             │  │
│ orden              │  │       │ fecha                     │  │
└────────┬───────────┘  │       │ tipo                      │  │
         │              │       │ estado                    │  │
         ▼              │       │ cantidad                  │  │
┌────────────────────┐  │       │ servicio                  │  │
│     miembros        │  │       │ grupo_servidores          │  │
├────────────────────┤  │       │ registrado_por (FK)       │──┤
│ id (PK)            │  │       └──────────────────────────┘  │
│ nombre             │  │                 ▲                   │
│ tipo               │──┘                 │                   │
│ grupo_id (FK)      │          ┌─────────┴───────┐           │
│ activo             │          │   categorias    │           │
│ orden              │          ├─────────────────┤           │
└────────────────────┘          │ id (PK)         │           │
                                │ nombre (UNIQUE) │           │
                                │ activo          │           │
                                └─────────────────┘           │
```

## Tablas

### usuarios
Almacena las cuentas de acceso al sistema.

| Columna | Tipo | Restriccion | Descripcion |
|---------|------|-------------|-------------|
| id | INTEGER | PK AUTOINCREMENT | Identificador unico |
| username | TEXT | UNIQUE NOT NULL | Nombre de usuario |
| password_hash | TEXT | NOT NULL | Hash bcrypt de la contrasena |
| nombre | TEXT | NOT NULL | Nombre completo del usuario |
| rol | TEXT | DEFAULT 'user' | 'admin' o 'user' |
| activo | INTEGER | DEFAULT 1 | 0=inactivo, 1=activo |
| ultimo_acceso | TEXT | | Fecha ISO del ultimo login |

### grupos_discipulado
Grupos/clases de discipulado, cada uno con su propia lista de integrantes.

| Columna | Tipo | Restriccion | Descripcion |
|---------|------|-------------|-------------|
| id | INTEGER | PK AUTOINCREMENT | Identificador unico |
| nombre | TEXT | NOT NULL | Nombre del grupo (ej: "Discipulado 1") |
| lugar | TEXT | | Ubicacion donde se reune el grupo |
| activo | INTEGER | DEFAULT 1 | 0=inactivo, 1=activo |
| orden | INTEGER | DEFAULT 0 | Orden de visualizacion |

### miembros
Personas registradas en el sistema. Para discipulado, se vinculan a un grupo via `grupo_id`.

| Columna | Tipo | Restriccion | Descripcion |
|---------|------|-------------|-------------|
| id | INTEGER | PK AUTOINCREMENT | Identificador unico |
| nombre | TEXT | NOT NULL | Nombre del miembro |
| tipo | TEXT | NOT NULL | 'discipulado' o 'pueblo' |
| grupo_id | INTEGER | FK -> grupos_discipulado(id) | NULL si es pueblo |
| activo | INTEGER | DEFAULT 1 | 0=inactivo, 1=activo |
| orden | INTEGER | DEFAULT 0 | Orden de visualizacion |

### categorias
Departamentos del pueblo (Danza, Cafeteria, Alabanza, etc.).

| Columna | Tipo | Restriccion | Descripcion |
|---------|------|-------------|-------------|
| id | INTEGER | PK AUTOINCREMENT | Identificador unico |
| nombre | TEXT | UNIQUE NOT NULL | Nombre de la categoria |
| activo | INTEGER | DEFAULT 1 | 0=inactivo, 1=activo |

### asistencias
Registro unico de asistencia para ambos modulos (discipulado y pueblo).

| Columna | Tipo | Restriccion | Descripcion |
|---------|------|-------------|-------------|
| id | INTEGER | PK AUTOINCREMENT | Identificador unico |
| miembro_id | INTEGER | FK -> miembros(id) | NULL si es registro por categoria |
| categoria_id | INTEGER | FK -> categorias(id) | NULL si es discipulado |
| grupo_id | INTEGER | FK -> grupos_discipulado(id) | NULL si es pueblo |
| fecha | TEXT | NOT NULL | Fecha ISO del registro |
| tipo | TEXT | NOT NULL | 'discipulado' o 'pueblo' |
| estado | TEXT | | 'presente', 'reportado', 'ausente' |
| cantidad | INTEGER | DEFAULT 1 | Conteo de personas (para pueblo) |
| servicio | TEXT | | 'Primer', 'Segundo', 'Tercer', 'Unico' |
| grupo_servidores | TEXT | | Grupo de servidores asignado |
| registrado_por | INTEGER | FK -> usuarios(id) | Quien registro (NULL si publico) |

## Indices

```sql
CREATE INDEX idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX idx_asistencias_tipo ON asistencias(tipo);
CREATE INDEX idx_asistencias_miembro ON asistencias(miembro_id);
CREATE INDEX idx_asistencias_grupo ON asistencias(grupo_id);
CREATE INDEX idx_miembros_tipo ON miembros(tipo);
CREATE INDEX idx_miembros_grupo ON miembros(grupo_id);
CREATE INDEX idx_usuarios_username ON usuarios(username);
```

## Resumen de Endpoints

| Metodo | Ruta | Autenticacion | Descripcion |
|--------|------|--------------|-------------|
| POST | /api/auth/login | No | Inicio de sesion |
| POST | /api/publico/pueblo/asistencia | No | Registro publico de asistencia |
| GET | /api/asistencias/resumen | JWT | Resumen para dashboard |
| GET | /api/asistencias | JWT | Listar asistencias (con filtros) |
| POST | /api/asistencias | JWT | Crear asistencia |
| PUT | /api/asistencias/:id | JWT | Actualizar asistencia |
| DELETE | /api/asistencias/:id | JWT | Eliminar asistencia |
| GET | /api/miembros | JWT | Listar miembros (filtros: tipo, grupo_id) |
| POST | /api/miembros | JWT | Crear miembro |
| PUT | /api/miembros/:id | JWT | Actualizar miembro |
| DELETE | /api/miembros/:id | JWT | Eliminar miembro |
| GET | /api/grupos | JWT | Listar grupos con total de miembros |
| POST | /api/grupos | JWT | Crear grupo de discipulado |
| PUT | /api/grupos/:id | JWT | Actualizar grupo |
| DELETE | /api/grupos/:id | JWT | Eliminar grupo |
| GET | /api/categorias | JWT | Listar categorias del pueblo |
| POST | /api/categorias | JWT | Crear categoria |
| PUT | /api/categorias/:id | JWT | Actualizar categoria |
| DELETE | /api/categorias/:id | JWT | Eliminar categoria |
| GET | /api/pueblo/reportes | JWT | Reportes de asistencia del pueblo |
| GET | /api/usuarios | JWT+admin | Listar usuarios |
| POST | /api/usuarios | JWT+admin | Crear usuario |
| PUT | /api/usuarios/:id | JWT+admin | Actualizar usuario |
| PUT | /api/usuarios/:id/password | JWT+admin | Cambiar contrasena |
| DELETE | /api/usuarios/:id | JWT+admin | Desactivar usuario |

## Permisos

| Recurso | Rol | Acceso |
|---------|-----|--------|
| Login | Publico | Sin restriccion |
| Asistencia Pueblo | Publico | Solo registro (POST) |
| Asistencia Pueblo | user/admin | Reportes (GET) |
| Categorias | admin | CRUD completo |
| Grupos Discipulado | user/admin | CRUD completo |
| Miembros | user/admin | CRUD completo |
| Usuarios | admin | CRUD completo |

## Migracion

El esquema anterior usaba SQL.js en el navegador con persistencia en localStorage.
La migracion a better-sqlite3 server-side preserva el mismo modelo relacional
con las tablas: usuarios, miembros, categorias, asistencias.
Se agrego `grupos_discipulado` y la columna `grupo_id` en miembros y asistencias.
