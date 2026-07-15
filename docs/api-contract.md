# Contrato HTTP de la API

## Propósito

Este documento define cómo la API comunica resultados y errores al frontend y a otros
consumidores. Aplica a todos los endpoints bajo `/api`.

## Respuestas exitosas

Los endpoints de consulta devuelven directamente el recurso o la colección solicitada para
conservar compatibilidad con el frontend actual.

Las operaciones de escritura conservan este cuerpo:

```json
{
    "success": true,
    "id": 1
}
```

El campo `id` aparece únicamente cuando se crea un registro.

El reemplazo completo de asistencia de un grupo devuelve el total persistido:

```json
{
    "success": true,
    "total": 12
}
```

`PUT /api/asistencias/grupos/:grupoId` recibe una fecha y exactamente un estado por cada
miembro activo del grupo. La eliminación de registros anteriores y la inserción de la nueva
lista ocurren dentro de una sola transacción.

## Respuestas de error

Todo error utiliza la misma estructura:

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

- `code` es estable y permite tomar decisiones sin comparar mensajes.
- `message` está preparado para mostrarse al usuario.
- `details` identifica campos específicos y es un arreglo vacío cuando no aplica.

## Códigos de estado

| Estado | Uso |
|---|---|
| `200 OK` | Consulta, actualización o eliminación confirmada |
| `201 Created` | Registro creado correctamente |
| `400 Bad Request` | Validación o JSON inválido |
| `401 Unauthorized` | Credenciales, token o sesión inválidos |
| `403 Forbidden` | Usuario autenticado sin el rol requerido |
| `404 Not Found` | Recurso o ruta de API inexistente |
| `409 Conflict` | Duplicado o conflicto con registros relacionados |
| `500 Internal Server Error` | Fallo inesperado no revelado al consumidor |

## Códigos de error

| Código | Estado habitual | Significado |
|---|---:|---|
| `VALIDATION_ERROR` | 400 | Uno o más campos no cumplen el contrato |
| `INVALID_JSON` | 400 | El cuerpo no contiene JSON válido |
| `AUTH_REQUIRED` | 401 | No se proporcionó un token Bearer |
| `INVALID_TOKEN` | 401 | El JWT es inválido o expiró |
| `INVALID_CREDENTIALS` | 401 | Usuario o contraseña incorrectos |
| `SESSION_UNAVAILABLE` | 401 | El usuario del token ya no está disponible |
| `FORBIDDEN` | 403 | El rol no autoriza la operación |
| `NOT_FOUND` | 404 | La ruta API no existe |
| `*_NOT_FOUND` | 404 | El recurso específico no existe |
| `RESOURCE_CONFLICT` | 409 | Una restricción única impide duplicar datos |
| `RELATION_CONFLICT` | 409 | Una clave foránea impide la operación |
| `INTERNAL_ERROR` | 500 | Error inesperado registrado por el servidor |

## Reglas de validación comunes

- Los identificadores son enteros positivos.
- Las fechas usan `YYYY-MM-DD` y deben representar un día real.
- `tipo` acepta `discipulado` o `pueblo`.
- `estado` acepta `presente`, `reportado` o `ausente`.
- Las cantidades deben ser enteros positivos dentro del límite documentado.
- Los indicadores booleanos aceptan booleanos, cero o uno.
- El texto se normaliza y se limita antes de llegar a SQLite.
- Las actualizaciones deben incluir al menos un campo permitido.

## Comportamiento del cliente HTTP

El frontend transforma los errores en `ApiError` con estas propiedades:

- `status`
- `code`
- `message`
- `details`

Un fallo de red usa `NETWORK_ERROR` y estado cero. Una respuesta no JSON usa
`INVALID_RESPONSE`. Un `401` de una ruta protegida limpia la sesión y notifica a la aplicación;
un `401` del login permanece como error de credenciales.

## Compatibilidad y evolución

Los cuerpos exitosos actuales se conservarán durante la reestructuración de capas. Cualquier
cambio futuro debe actualizar este documento y `postman/asistencia_api.json` en el mismo commit.
