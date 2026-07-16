/**
 * Configuración validada del servidor para evitar valores implícitos dispersos.
 */
// Convierte una cadena de orígenes en una lista segura para CORS.
const parsearOrigenesCors = (value) => {
    if (!value) return [];
    return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
        .map(item => {
            try {
                return new URL(item).origin;
            } catch (error) {
                throw new Error(`CORS_ORIGINS contiene un origen inválido: ${item}`);
            }
        });
};

// Restringe el puerto al intervalo aceptado por el servidor TCP.
const validarPuerto = (value) => {
    const port = Number(value ?? 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('PORT debe ser un entero entre 1 y 65535');
    }
    return port;
};

// Confirma que Intl reconozca la zona antes de iniciar casos de uso con fechas.
const validarZonaHoraria = (value) => {
    const timeZone = value || 'America/Mexico_City';
    try {
        new Intl.DateTimeFormat('es-MX', { timeZone }).format();
    } catch (error) {
        throw new Error('BUSINESS_TIME_ZONE no es una zona horaria válida');
    }
    return timeZone;
};

// Convierte un límite numérico de entorno en un entero positivo seguro.
const validarEnteroPositivo = (value, nombre, fallback) => {
    const parsed = Number(value ?? fallback);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`${nombre} debe ser un entero positivo`);
    }
    return parsed;
};

// Mantiene el límite de JSON como una cadena compatible con express.json.
const validarTamanoJson = (value) => {
    const limit = value || '1mb';
    if (!/^\d+(b|kb|mb|gb)$/i.test(limit)) {
        throw new Error('JSON_BODY_LIMIT debe usar una unidad válida como 1mb');
    }
    return limit;
};

const cargarConfig = (env = process.env) => {
    // Detiene el arranque cuando falta el secreto requerido para verificar sesiones.
    if (!env.JWT_SECRET) {
        throw new Error('Falta JWT_SECRET en las variables de entorno');
    }

    return Object.freeze({
        port: validarPuerto(env.PORT),
        jwtSecret: env.JWT_SECRET,
        businessTimeZone: validarZonaHoraria(env.BUSINESS_TIME_ZONE),
        corsOrigins: parsearOrigenesCors(env.CORS_ORIGINS),
        jsonBodyLimit: validarTamanoJson(env.JSON_BODY_LIMIT),
        authRateLimitWindowMs: validarEnteroPositivo(
            env.AUTH_RATE_LIMIT_WINDOW_MS,
            'AUTH_RATE_LIMIT_WINDOW_MS',
            60000
        ),
        authRateLimitMax: validarEnteroPositivo(
            env.AUTH_RATE_LIMIT_MAX,
            'AUTH_RATE_LIMIT_MAX',
            20
        ),
        publicRateLimitWindowMs: validarEnteroPositivo(
            env.PUBLIC_RATE_LIMIT_WINDOW_MS,
            'PUBLIC_RATE_LIMIT_WINDOW_MS',
            60000
        ),
        publicRateLimitMax: validarEnteroPositivo(
            env.PUBLIC_RATE_LIMIT_MAX,
            'PUBLIC_RATE_LIMIT_MAX',
            60
        )
    });
};

module.exports = { cargarConfig };
