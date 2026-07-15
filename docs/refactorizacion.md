# Refactorización - Sistema de Asistencia Monte Carmelo

## Fase 1: Migración a Node.js + Express + SQLite (Completada)

### Motivación
El sistema original era un archivo HTML monolitico (>1200 lineas) con SQL.js en el navegador y persistencia en localStorage. Se refactorizo a una arquitectura por capas con servidor Express, base de datos SQLite server-side (better-sqlite3) y autenticacion JWT.

### Cambios principales
- Backend Node.js + Express con API REST
- Base de datos SQLite en el servidor (better-sqlite3)
- Autenticacion JWT con bcryptjs
- Frontend React 18 + Babel Standalone (sin build step)
- Tailwind CSS + Lucide icons para UI
- Docker + docker-compose para despliegue en Oracle Cloud Free

## Fase 2: Login + Autenticacion (Completada)

### Implementado
- Formulario de inicio de sesion con validacion
- JWT con expiracion de 24h
- Proteccion de rutas via middleware
- Sesion persistente en localStorage
- Usuario por defecto: admin / admin123

### Flujo
```
Usuario → Login → POST /api/auth/login → JWT → localStorage
  → app.js verifica token → muestra dashboard o login
```

## Fase 3: Dashboard (Resumen de Asistencias) - Pendiente

### Objetivo
Mostrar un resumen visual de las asistencias registradas:
- Total de miembros en discipulado
- Total de miembros en pueblo (por categoria)
- Asistencias del dia actual
- Grafica simple de asistencias semanal/mensual
- Botones de acceso rapido a Discipulado y Pueblo

### Endpoints necesarios
- `GET /api/asistencias/resumen` → estadisticas generales
- `GET /api/miembros?tipo=discipulado` → lista de miembros
- `GET /api/miembros?tipo=pueblo` → lista de miembros

## Fase 4: Modulo Discipulado - Pendiente

### Objetivo
Gestion de grupos de discipulado con lista de integrantes por grupo y registro de asistencia.

### Funcionalidades
- CRUD de grupos de discipulado (nombre, lugar/ubicacion)
- Cada grupo tiene su propia lista de integrantes
- Agregar/eliminar integrantes a un grupo
- Registrar asistencia por grupo (presente/ausente/reportado)
- Ver historial de asistencias por grupo
- Exportar reporte PDF de asistencias

### Esquema de datos extendido
Se agregan las tablas `grupos_discipulado` y se relaciona `miembros` con `grupo_id`.

## Fase 5: Modulo Pueblo - Pendiente

### Objetivo
Registro de asistencia del pueblo (departamentos/categorias) con acceso publico limitado.

### Funcionalidades
- CRUD de categorias/departamentos del pueblo
- Registro de asistencia por categoria (cantidad de personas)
- Registro de servicio (Primer, Segundo, Tercer, Unico)
- **Acceso publico**: cualquier persona puede registrar asistencia sin necesidad de login
- **Acceso restringido**: solo usuarios autenticados pueden ver reportes y estadisticas
- Exportar reporte PDF

### Permisos
- `PUBLICO`: POST /api/pueblo/asistencia (registrar asistencia)
- `AUTH`: GET /api/pueblo/reportes (ver reportes)
- `ADMIN`: CRUD de categorias y gestion de miembros

## Fase 6: CRUD Usuarios (Admin) - Pendiente

### Objetivo
Gestion de usuarios del sistema, solo accesible por administradores.

### Funcionalidades
- Listar usuarios
- Crear usuario (nombre, username, password, rol)
- Editar usuario
- Desactivar/activar usuario
- Cambiar contraseña

## Fase 7: Docker + Oracle Cloud Deploy - Pendiente

### Objetivo
Desplegar la aplicacion en Oracle Cloud Free Tier usando Docker.

### Componentes
- Dockerfile con Node.js 20
- docker-compose.yml con el servicio web
- Volumen persistente para la base de datos SQLite
- Exposicion en puerto 3000

---

## Estructura Actual del Proyecto

```
/Asistencia-Discipulado
├── server/
│   ├── index.js              # Express app (API + estaticos)
│   ├── package.json
│   ├── database/
│   │   ├── connection.js     # Conexion better-sqlite3
│   │   └── init.sql          # Schema SQL
│   ├── routes/
│   │   ├── auth.js           # Login (POST /api/auth/login)
│   │   ├── asistencias.js    # CRUD asistencias
│   │   └── usuarios.js       # CRUD usuarios (admin)
│   ├── services/
│   │   └── pdf.js            # Generacion de PDFs
│   └── middleware/
│       └── auth.js           # JWT verification
├── public/
│   ├── index.html            # Frontend entry point
│   ├── styles.css            # Estilos personalizados
│   ├── app.js                # Orquestador React
│   └── js/
│       ├── config/
│       │   └── constants.js  # Constantes globales
│       ├── services/
│       │   └── api.js        # Fetch wrapper + JWT
│       ├── components/
│       │   ├── login.js      # Pantalla de login
│       │   ├── dashboard.js  # Resumen de asistencias
│       │   ├── discipulado.js# CRUD + asistencia discipulado
│       │   └── pueblo.js     # CRUD + asistencia pueblo
│       └── utils/
│           └── helpers.js    # Funciones helper
├── docs/
│   ├── arquitectura.md       # Arquitectura del sistema
│   ├── db-schema.md          # Esquema de base de datos
│   └── refactorizacion.md    # Historial de cambios
├── database/
│   └── init.sql              # Schema de referencia
├── Dockerfile
├── docker-compose.yml
├── README.md
└── AGENTS.md
```
