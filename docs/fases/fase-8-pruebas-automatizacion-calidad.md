# Fase 8: Pruebas y automatización de calidad

## Objetivo

Proteger los contratos funcionales y arquitectónicos del proyecto con una base de pruebas
automatizadas que pueda ejecutarse de forma confiable en el entorno del repositorio.

## Contexto

La fase 7 ya había dejado una UI más usable y accesible. En ese punto faltaba una red de seguridad
que confirmara que los cambios de arquitectura, validación y permisos no rompieran los flujos
críticos. Esta fase resuelve esa parte con pruebas unitarias e integración en memoria.

## Qué se implementó

- Pruebas unitarias para validación de texto, identificadores, fechas y errores controlados.
- Pruebas unitarias para autenticación con emisión de JWT y actualización de último acceso.
- Pruebas de integración para login, restauración de sesión, permisos, registro de asistencias y
  resumen del tablero.
- Un harness de Express en memoria para evitar abrir puertos locales en el entorno del proyecto.
- Scripts de calidad en `server/package.json` para sintaxis, pruebas y verificación completa.

## Decisiones técnicas

- Se evitó abrir sockets locales porque el entorno de ejecución del proyecto bloquea `listen()`
  sobre `127.0.0.1`.
- Se reutilizó SQLite en memoria para conservar el contrato real de la base de datos sin depender
  de archivos persistentes durante las pruebas.
- Se mantuvo el contrato HTTP real de Express, pero con un harness controlado por el test.

## Comandos de verificación

- `npm run check`
- `npm test`
- `npm run verify`

## Resultado

- La suite automatizada queda lista para proteger las fases siguientes.
- El proyecto tiene una base repetible para revisar cambios de backend antes de integrarlos.
- La arquitectura documentada ya incluye una capa explícita de calidad y verificación.
