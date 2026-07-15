/**
 * Middleware central para responder errores de API sin exponer detalles internos.
 */
const { HttpError } = require('../utils/http-error');

// Convierte cualquier ruta API desconocida en una respuesta JSON predecible.
const rutaNoEncontrada = (req, res, next) => {
    next(new HttpError(404, 'NOT_FOUND', 'El recurso solicitado no existe'));
};

// Traduce errores conocidos de SQLite a conflictos comprensibles para el cliente.
const normalizarError = (error) => {
    if (error instanceof HttpError) return error;

    // Informa JSON mal formado como error del cliente y no como fallo del servidor.
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return new HttpError(400, 'INVALID_JSON', 'El cuerpo de la solicitud no es JSON válido');
    }

    // Evita revelar el índice o la sentencia que produjo una restricción única.
    if (error.code?.startsWith('SQLITE_CONSTRAINT_UNIQUE')) {
        return new HttpError(409, 'RESOURCE_CONFLICT', 'Ya existe un registro con esos datos');
    }

    // Conserva la integridad referencial cuando una relación no existe o sigue en uso.
    if (error.code?.startsWith('SQLITE_CONSTRAINT_FOREIGNKEY')) {
        return new HttpError(409, 'RELATION_CONFLICT', 'La operación afecta registros relacionados');
    }

    return new HttpError(500, 'INTERNAL_ERROR', 'Ocurrió un error interno en el servidor');
};

// Emite el contrato oficial y registra únicamente los fallos inesperados para diagnóstico.
const manejarErrores = (error, req, res, next) => {
    const normalized = normalizarError(error);
    if (normalized.status >= 500) console.error(error);

    return res.status(normalized.status).json({
        error: {
            code: normalized.code,
            message: normalized.message,
            details: normalized.details
        }
    });
};

module.exports = { manejarErrores, rutaNoEncontrada };
