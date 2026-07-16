# Levantamiento de servicios

## Propósito

Este documento describe el proceso para levantar la aplicación en desarrollo local y en Docker.
La referencia principal de arquitectura sigue siendo `docs/arquitectura.md`.

## Requisitos previos

- Node.js 20 o superior.
- npm instalado.
- Docker y Docker Compose si se usará el entorno contenedorizado.
- Variables de entorno definidas en `server/.env` o exportadas en la terminal.

## Opción 1: Ejecución local del servidor

### 1. Entrar al servidor

```bash
cd server
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Verificar el código

```bash
npm run verify
```

### 4. Levantar el servidor

```bash
npm start
```

La API y los archivos estáticos quedan disponibles en `http://localhost:3000`.

## Opción 2: Ejecución con Docker Compose

### 1. Preparar variables

Ajustar `JWT_SECRET`, `BUSINESS_TIME_ZONE` y, si aplica, `CORS_ORIGINS` y `DB_PATH`.

### 2. Construir y levantar servicios

```bash
docker compose up --build -d
```

### 3. Verificar estado

```bash
docker compose ps
docker compose logs -f
```

### 4. Confirmar salud

```bash
curl http://localhost:3000/healthz
```

## Detener servicios

### Local

Detener el proceso con `Ctrl+C`.

### Docker Compose

```bash
docker compose down
```

## Observaciones operativas

- La base SQLite se conserva en el volumen `asistencia_data` cuando se usa Docker Compose.
- El endpoint `/healthz` confirma que Express y la base de datos responden.
- El arranque seguro del servidor depende de `JWT_SECRET`.
