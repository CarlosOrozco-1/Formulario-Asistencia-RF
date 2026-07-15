# Fase 2: Contratos HTTP y Manejo de Errores

## Estado

- **Resultado:** completada
- **Commit funcional:** `52dca95`
- **Fecha de cierre:** 15 de julio de 2026
- **Dependencia:** Fase 1 completada

## Objetivo

Establecer una comunicación predecible entre el frontend y el backend antes de separar
físicamente las capas internas. La fase debía impedir que cada endpoint inventara su propia
respuesta de error y evitar que el frontend confundiera validación, permisos y desconexión.

## Situación anterior

- Las rutas devolvían errores con formatos diferentes.
- Algunas escrituras exitosas respondían `200` aunque crearan registros.
- Los identificadores, fechas, enumeraciones y filtros llegaban a SQLite sin normalización.
- Los errores de restricciones SQLite podían convertirse en fallos internos poco claros.
- El cliente intentaba convertir todas las respuestas directamente con `res.json()`.
- Varias operaciones actualizaban el estado visual aunque el servidor rechazara la solicitud.
- La colección Postman no representaba todos los endpoints implementados.

## Decisiones tomadas

### Contrato de error

Todos los errores de API utilizan:

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Los datos enviados no son válidos",
        "details": [
            {
                "field": "fecha",
                "message": "Debe usar el formato YYYY-MM-DD"
            }
        ]
    }
}
```

El frontend toma decisiones mediante `code` y `status`; `message` puede mostrarse al usuario y
`details` conserva errores asociados a campos.

### Códigos HTTP

| Estado | Decisión |
|---|---|
| `200` | Consulta, actualización o eliminación confirmada |
| `201` | Creación confirmada |
| `400` | Validación o JSON inválido |
| `401` | Autenticación o sesión inválida |
| `403` | Rol sin autorización |
| `404` | Recurso o ruta API inexistente |
| `409` | Duplicado o conflicto de relaciones |
| `500` | Error inesperado oculto al consumidor |

### Compatibilidad

Los cuerpos exitosos existentes se conservaron para no romper los componentes durante la
refactorización. La normalización completa de casos de uso se realizará después de separar las
capas.

## Implementación

### Backend

- `server/utils/http-error.js` define errores HTTP controlados.
- `server/utils/validation.js` centraliza validación y normalización.
- `server/middleware/error.js` maneja errores y rutas inexistentes.
- `server/middleware/auth.js` usa el contrato compartido para `401` y `403`.
- Todas las rutas validan sus cuerpos, parámetros y filtros.
- Las restricciones únicas de SQLite se traducen a `RESOURCE_CONFLICT`.
- Las restricciones de clave foránea se traducen a `RELATION_CONFLICT`.
- Los errores internos se registran sin entregar SQL o rutas del servidor al cliente.

### Frontend

- `ApiError` conserva `status`, `code`, `message` y `details`.
- Los fallos de conexión usan `NETWORK_ERROR`.
- Las respuestas no interpretables usan `INVALID_RESPONSE`.
- El login distingue credenciales inválidas de desconexión.
- Las operaciones CRUD solo modifican el estado después de una respuesta exitosa.
- Los formularios permanecen abiertos cuando la API rechaza una operación.

### Integridad corregida

- `grupo_id` ahora se persiste al crear asistencia de discipulado.
- Se valida que un miembro pertenezca al grupo indicado.
- La edición parcial de usuarios ya no convierte `activo` en `NULL`.
- Las fechas imposibles, como `2026-02-30`, se rechazan.
- Las referencias a categorías inactivas o inexistentes se rechazan.

### Postman

`postman/asistencia_api.json` contiene treinta solicitudes organizadas por módulo. El login
guarda automáticamente el JWT y la carpeta de contrato comprueba errores `400` y `404`.

## Verificaciones realizadas

- Sintaxis de todos los archivos JavaScript del backend.
- Análisis de JSX de los componentes modificados.
- Parseo completo de la colección Postman.
- Pruebas aisladas del cliente HTTP.
- Construcción Docker con Node.js 20.
- Login correcto e incorrecto.
- Token ausente e inválido.
- Acceso de usuario sin rol administrador.
- Creaciones con respuesta `201`.
- Recursos inexistentes con respuesta `404`.
- Duplicados y claves foráneas con respuesta `409`.
- JSON mal formado y fechas imposibles con respuesta `400`.
- Persistencia de `grupo_id` y preservación de `activo`.

## Riesgos y deuda restante

- Las rutas todavía contienen SQL y reglas de aplicación; se atiende en la Fase 3.
- El guardado de una lista de asistencia aún realiza múltiples solicitudes; se atiende mediante
  una transacción en la Fase 3.
- Las alertas nativas siguen siendo temporales; se reemplazarán con el sistema de diseño.
- Las pruebas se ejecutan como verificaciones externas y todavía no forman una suite versionada.
- La actualización de dependencias con vulnerabilidades se reserva para la fase de seguridad.

## Archivos principales

- `docs/api-contract.md`
- `docs/arquitectura.md`
- `docs/fases-reestructuracion.md`
- `postman/asistencia_api.json`
- `public/js/services/api.js`
- `server/middleware/error.js`
- `server/utils/http-error.js`
- `server/utils/validation.js`
- `server/routes/*.js`

## Criterios de aceptación alcanzados

- Todos los endpoints modificados usan un contrato documentado.
- El frontend distingue validación, permisos, sesión y conexión.
- Los errores internos no exponen detalles sensibles.
- Postman cubre operaciones exitosas y errores representativos.

## Restauración

El estado anterior a esta fase se encuentra en el commit `74b591f`. Para inspeccionarlo sin
alterar la rama actual puede usarse:

```bash
git show 74b591f
```

No se recomienda revertir parcialmente el contrato porque frontend y backend dependen del mismo
formato de error.
