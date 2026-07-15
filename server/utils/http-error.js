/**
 * Error HTTP controlado para separar fallos esperados de errores internos.
 */
class HttpError extends Error {
    // Conserva código, estado y detalles para construir una respuesta uniforme.
    constructor(status, code, message, details = []) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

// Facilita declarar errores de validación con el mismo contrato en todas las rutas.
const validationError = (field, message) => new HttpError(
    400,
    'VALIDATION_ERROR',
    'Los datos enviados no son válidos',
    [{ field, message }]
);

module.exports = { HttpError, validationError };
