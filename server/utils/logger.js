/**
 * Registro operativo en formato estructurado para diagnósticos y despliegue.
 */

// Serializa eventos como JSON para que sean fáciles de leer y de indexar.
const serializarEvento = (level, message, meta = {}) => JSON.stringify({
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta
});

// Emite eventos informativos sin introducir dependencias adicionales.
const registrarInfo = (message, meta = {}) => {
    console.log(serializarEvento('info', message, meta));
};

// Emite eventos de error con metadatos mínimos para diagnóstico.
const registrarError = (message, meta = {}) => {
    console.error(serializarEvento('error', message, meta));
};

module.exports = { registrarError, registrarInfo };
