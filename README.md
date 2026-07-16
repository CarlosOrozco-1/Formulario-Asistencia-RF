# Gestión de Asistencia

Sistema para registrar asistencias de Discipulado y Pueblo con API REST, SQLite y una interfaz
servida por Express.

## Arquitectura

- Backend: Node.js + Express
- Base de datos: SQLite con `better-sqlite3`
- Autenticación: JWT con expiración de 24 horas
- Interfaz: SPA estática servida desde `public/`
- Despliegue: Docker y Docker Compose

La arquitectura oficial y las decisiones de diseño están documentadas en `docs/arquitectura.md`.

## Requisitos locales

- Node.js 20 o superior
- npm

## Variables de entorno

Las variables principales se describen en `server/.env.example`:

- `PORT`
- `JWT_SECRET`
- `BUSINESS_TIME_ZONE`
- `DB_PATH`
- `CORS_ORIGINS`
- `JSON_BODY_LIMIT`
- `AUTH_RATE_LIMIT_WINDOW_MS`
- `AUTH_RATE_LIMIT_MAX`
- `PUBLIC_RATE_LIMIT_WINDOW_MS`
- `PUBLIC_RATE_LIMIT_MAX`

## Ejecución local

```bash
cd server
npm install
npm run verify
npm start
```

La aplicación queda disponible en `http://localhost:3000`.

## Healthcheck

El servidor expone `GET /healthz` para validar disponibilidad y base de datos.

## Docker

```bash
docker compose up --build
```

El contenedor usa `/app/data/asistencias.db` como ruta persistente de SQLite y expone el puerto
`3000`.

## Respaldo de datos

- La base SQLite puede moverse mediante `DB_PATH`.
- En Docker Compose, la ruta `./data` se monta como volumen persistente.

## Documentación

- `docs/arquitectura.md`
- `docs/fases-reestructuracion.md`
- `docs/refactorizacion.md`
- `docs/fases/`

## Verificación

- `npm run check`
- `npm test`
- `npm run verify`
