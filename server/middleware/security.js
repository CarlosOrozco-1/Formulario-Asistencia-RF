/**
 * Endurecimiento HTTP y control básico de abuso para la API y la SPA.
 */

// Construye utilidades de seguridad a partir de la configuración validada.
const crearMiddlewareSeguridad = ({
    corsOrigins = [],
    authRateLimitWindowMs = 60000,
    authRateLimitMax = 20,
    publicRateLimitWindowMs = 60000,
    publicRateLimitMax = 60
} = {}) => {
    // Conserva los orígenes permitidos en una estructura de búsqueda rápida.
    const origenesPermitidos = new Set(corsOrigins);

    // Añade cabeceras defensivas sin bloquear la carga de la interfaz.
    const establecerCabeceras = (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'same-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        next();
    };

    // Resuelve si un origen externo puede consumir la API mediante CORS.
    const permitirCors = (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }

        if (!origenesPermitidos.size) {
            callback(null, false);
            return;
        }

        callback(null, origenesPermitidos.has(origin));
    };

    // Fabrica un limitador simple por IP para frenar abuso en endpoints expuestos.
    const crearLimitador = ({ etiqueta, ventanaMs, maximo }) => {
        const ventana = new Map();

        return (req, res, next) => {
            const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
                || req.connection?.remoteAddress
                || req.socket?.remoteAddress
                || 'unknown';
            const clave = `${etiqueta}:${ip}`;
            const ahora = Date.now();
            const estado = ventana.get(clave);

            if (!estado || ahora - estado.inicio >= ventanaMs) {
                ventana.set(clave, { inicio: ahora, conteo: 1 });
                next();
                return;
            }

            if (estado.conteo >= maximo) {
                res.status(429).json({
                    error: {
                        code: 'RATE_LIMITED',
                        message: 'Demasiadas solicitudes, intenta más tarde',
                        details: []
                    }
                });
                return;
            }

            estado.conteo += 1;
            next();
        };
    };

    return {
        establecerCabeceras,
        permitirCors,
        limitarLogin: crearLimitador({
            etiqueta: 'login',
            ventanaMs: authRateLimitWindowMs,
            maximo: authRateLimitMax
        }),
        limitarPublico: crearLimitador({
            etiqueta: 'publico',
            ventanaMs: publicRateLimitWindowMs,
            maximo: publicRateLimitMax
        })
    };
};

module.exports = { crearMiddlewareSeguridad };
