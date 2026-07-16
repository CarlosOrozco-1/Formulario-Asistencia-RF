# Fase 9: Seguridad, operación y documentación final

## Objetivo

Dejar la arquitectura corregida lista para operación mantenible, despliegue en contenedor y
consulta documental confiable.

## Qué se implementó

- Cabeceras defensivas a nivel HTTP para reducir exposición del navegador.
- CORS restringido a orígenes explícitos cuando el despliegue lo requiere.
- Limitación básica de frecuencia para endpoints públicos expuestos.
- Healthcheck `/healthz` sin autenticación para Docker y balanceadores.
- Ruta de datos configurable mediante `DB_PATH` para respaldos y volúmenes persistentes.
- Apagado limpio del proceso ante `SIGINT` y `SIGTERM`.
- Registro operativo estructurado para inicio, apagado y errores internos.
- Dockerfile endurecido con usuario no privilegiado y healthcheck.
- `docker-compose.yml` actualizado para persistencia de SQLite y variables operativas.
- README sincronizado con la forma real de ejecutar y operar la aplicación.

## Decisiones técnicas

- Se evitó introducir dependencias nuevas para mantener la superficie de mantenimiento baja.
- El rate limiting es intencionalmente básico y está centrado en los endpoints públicos.
- El healthcheck usa la propia API para validar que Express, rutas y base de datos responden.
- La base de datos puede moverse fuera del árbol del código sin alterar la aplicación.

## Verificación

- `npm run check`
- `npm test`
- `npm run verify`
- Revisión de Dockerfile, compose y documentación resultante

## Resultado

- El sistema queda preparado para respaldo, despliegue y monitoreo básico.
- La documentación refleja la implementación real y reduce ambigüedades operativas.
