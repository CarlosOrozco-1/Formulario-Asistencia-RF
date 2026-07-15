# Arquitectura del Sistema de Asistencia Monte Carmelo

## Patron Arquitectonico: Layered Architecture con Backend Express

Se eligio **Layered Architecture** porque es simple, predecible y se adapta perfectamente a proyectos que no creceran mas alla de un punado de modulos. Separa responsabilidades de forma vertical: cada capa solo conoce a la capa inmediatamente inferior.

## Vision General

```
┌──────────────────────────────────────────────────────────────────┐
│                    Oracle Cloud Free                             │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Express.js (servidor unico)               │  │
│  │                                                           │  │
│  │  ┌──────────────────┐     ┌────────────────────────────┐  │  │
│  │  │  Rutas API REST  │     │  Archivos Estaticos       │  │  │
│  │  │                  │     │                            │  │  │
│  │  │  POST /api/auth/*│     │  / -> public/index.html   │  │  │
│  │  │  GET  /api/miembros    │  /styles.css              │  │  │
│  │  │  CRUD /api/grupos│     │  /app.js                  │  │  │
│  │  │  POST /api/publico/*  │  /js/components/*          │  │  │
│  │  └────────┬──────────┘     └────────────────────────────┘  │  │
│  │           │                                                  │  │
│  │           ▼                                                  │  │
│  │  ┌──────────────────┐                                       │  │
│  │  │  better-sqlite3  │  <- asistencias.db (servidor)         │  │
│  │  └──────────────────┘                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Comunicacion Cliente-Servidor

```
Navegador                          Servidor Express
   │                                    │
   │  POST /api/auth/login              │
   │───────────────────────────────────>│
   │  { token: "jwt..." }              │
   │<───────────────────────────────────│
   │                                    │
   │  GET /api/miembros?grupo_id=1      │
   │  Authorization: Bearer jwt...      │
   │───────────────────────────────────>│
   │  [ { id, nombre, ... } ]          │
   │<───────────────────────────────────│
   │                                    │
   │  POST /api/publico/pueblo/asistencia │
   │  (sin JWT - acceso publico)        │
   │───────────────────────────────────>│
   │  { success: true, id: 1 }         │
   │<───────────────────────────────────│
```

## Estructura de Archivos Final

```
/Asistencia-Discipulado
├── server/
│   ├── index.js                    # Entry point Express
│   ├── package.json
│   ├── routes/
│   │   ├── auth.js                 # POST /api/auth/login
│   │   ├── asistencias.js          # CRUD asistencias + resumen
│   │   ├── usuarios.js             # CRUD usuarios (solo admin)
│   │   ├── miembros.js             # CRUD miembros con filtros
│   │   ├── grupos.js               # CRUD grupos de discipulado
│   │   ├── categorias.js           # CRUD categorias del pueblo
│   │   └── pueblo.js               # Reportes del pueblo
│   ├── database/
│   │   ├── init.sql                # Schema SQL completo
│   │   └── connection.js           # Conexion better-sqlite3
│   ├── services/
│   │   └── pdf.js                  # Generacion de PDFs
│   └── middleware/
│       └── auth.js                 # JWT verification + soloAdmin
├── public/
│   ├── index.html                  # Frontend entry point
│   ├── styles.css                  # Estilos globales
│   ├── app.js                      # Orquestador React
│   └── js/
│       ├── config/
│       │   └── constants.js        # Constantes globales
│       ├── services/
│       │   └── api.js              # Fetch wrapper + JWT
│       ├── components/
│       │   ├── login.js            # Pantalla de inicio
│       │   ├── dashboard.js        # Resumen de asistencias
│       │   ├── discipulado.js      # CRUD grupos + asistencia
│       │   ├── pueblo.js           # CRUD categorias + asistencia
│       │   └── usuarios.js         # CRUD usuarios (admin)
│       └── utils/
│           └── helpers.js          # Funciones helper
├── database/
│   └── init.sql                    # Schema de referencia
├── docs/
│   ├── arquitectura.md             # Este archivo
│   ├── db-schema.md                # Esquema de base de datos
│   └── refactorizacion.md          # Historial de cambios
├── Dockerfile
├── docker-compose.yml
├── .gitignore
├── README.md
└── AGENTS.md
```

## Tecnologias

| Capa | Tecnologia | Proposito |
|------|-----------|-----------|
| Servidor | Node.js + Express | API REST + static serving |
| Base de datos | better-sqlite3 | SQLite en servidor |
| Autenticacion | JWT + bcryptjs | Tokens de sesion |
| UI | React 18 + JSX | Componentes frontend |
| Estilos | Tailwind CSS + CSS | Diseno responsivo |
| Iconos | Lucide | Iconografia |
| PDF | jsPDF + autoTable | Reportes descargables |

## Flujo de Navegacion

```
App Inicia (sin token)
   │
   ▼
┌──────────────┐
│   Login      │  <- POST /api/auth/login -> obtiene JWT
│   (publico)  │
└──────┬───────┘
       │ exito
       ▼
┌──────────────────┐
│   Dashboard      │  <- GET /api/asistencias/resumen
│                  │
│  ┌────────────┐  │
│  │ Discipulado│  │  <- CRUD grupos + miembros + asistencia
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Pueblo     │  │  <- CRUD categorias + asistencia + reportes
│  └────────────┘  │
│  ┌────────────┐  │
│  │ Usuarios   │  │  <- Solo admin: CRUD usuarios
│  └────────────┘  │
└──────────────────┘

Acceso Publico (sin JWT):
  POST /api/publico/pueblo/asistencia
  -> Registro de asistencia del pueblo sin necesidad de login
```

## Permisos por Modulo

| Modulo | Accion | Requiere Auth | Rol |
|--------|--------|--------------|-----|
| Login | POST /api/auth/login | No | - |
| Pueblo | POST /api/publico/pueblo/asistencia | No | - |
| Pueblo | GET /api/pueblo/reportes | Si | user/admin |
| Categorias | CRUD /api/categorias | Si | admin |
| Discipulado | CRUD /api/grupos | Si | user/admin |
| Miembros | CRUD /api/miembros | Si | user/admin |
| Usuarios | CRUD /api/usuarios | Si | admin |
