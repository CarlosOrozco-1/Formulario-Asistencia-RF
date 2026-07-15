/**
 * Configuración validada del servidor para evitar valores implícitos dispersos.
 */
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

const cargarConfig = (env = process.env) => {
    // Detiene el arranque cuando falta el secreto requerido para verificar sesiones.
    if (!env.JWT_SECRET) {
        throw new Error('Falta JWT_SECRET en las variables de entorno');
    }

    return Object.freeze({
        port: validarPuerto(env.PORT),
        jwtSecret: env.JWT_SECRET,
        businessTimeZone: validarZonaHoraria(env.BUSINESS_TIME_ZONE)
    });
};

module.exports = { cargarConfig };
