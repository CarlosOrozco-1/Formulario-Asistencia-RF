/**
 * Utilidades compartidas para pruebas unitarias e integradas del servidor.
 */
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const Database = require('better-sqlite3');
const { crearApp } = require('../app');

// Carga el schema oficial para que cada prueba arranque con la misma estructura.
const cargarSchema = () => fs.readFileSync(
    path.join(__dirname, '../database/init.sql'),
    'utf8'
);

// Crea una base de datos aislada en memoria para evitar efectos colaterales entre pruebas.
const crearDbPrueba = () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    db.exec(cargarSchema());
    return db;
};

// Devuelve la configuración mínima requerida para probar sin variables de entorno reales.
const crearConfigPrueba = (overrides = {}) => ({
    port: 0,
    jwtSecret: 'test-secret',
    businessTimeZone: 'America/Mexico_City',
    ...overrides
});

// Construye una solicitud de Express en memoria para evitar abrir sockets locales.
const crearSolicitudPrueba = ({ method = 'GET', path: ruta = '/', headers = {}, body }) => {
    const contenido = body === undefined
        ? null
        : typeof body === 'string'
            ? body
            : JSON.stringify(body);
    const solicitud = Readable.from(contenido === null ? [] : [contenido]);
    solicitud.method = method;
    solicitud.url = ruta;
    solicitud.headers = Object.fromEntries(
        Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
    );
    if (contenido !== null && solicitud.headers['content-length'] === undefined) {
        solicitud.headers['content-length'] = Buffer.byteLength(contenido);
    }
    return solicitud;
};

// Construye una respuesta mínima compatible con Express para capturar el contrato HTTP.
const crearRespuestaPrueba = () => {
    const chunks = [];
    const headers = {};
    const respuesta = {
        statusCode: 200,
        headersSent: false,
        setHeader: (name, value) => {
            headers[String(name).toLowerCase()] = value;
        },
        getHeader: (name) => headers[String(name).toLowerCase()],
        getHeaders: () => ({ ...headers }),
        removeHeader: (name) => {
            delete headers[String(name).toLowerCase()];
        },
        writeHead: (statusCode, nuevosHeaders = {}) => {
            respuesta.statusCode = statusCode;
            Object.entries(nuevosHeaders).forEach(([name, value]) => {
                respuesta.setHeader(name, value);
            });
        },
        write: (chunk, encoding, callback) => {
            if (chunk !== undefined && chunk !== null) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
            }
            if (typeof callback === 'function') callback();
            return true;
        },
        end: (chunk, encoding, callback) => {
            if (chunk !== undefined && chunk !== null) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
            }
            respuesta.headersSent = true;
            if (typeof callback === 'function') callback();
            if (respuesta._resolver) respuesta._resolver();
            return respuesta;
        },
        on: () => respuesta,
        once: () => respuesta
    };
    respuesta.cerrar = () => new Promise(resolve => {
        respuesta._resolver = resolve;
    });
    respuesta.getBodyText = () => Buffer.concat(chunks).toString('utf8');
    respuesta.getBodyJson = () => {
        const texto = respuesta.getBodyText();
        return texto ? JSON.parse(texto) : null;
    };
    return respuesta;
};

// Ejecuta la app en memoria y devuelve el contrato HTTP observado por Express.
const ejecutarSolicitud = async (app, options) => {
    const solicitud = crearSolicitudPrueba(options);
    const respuesta = crearRespuestaPrueba();
    const cierre = respuesta.cerrar();
    app.handle(solicitud, respuesta, (error) => {
        if (error) {
            respuesta._error = error;
            if (respuesta._resolver) respuesta._resolver();
        }
    });
    await cierre;
    if (respuesta._error) throw respuesta._error;
    return respuesta;
};

// Crea la aplicación real para probar rutas, middleware y controladores sin abrir puertos.
const crearAppPrueba = (db, config = crearConfigPrueba()) => crearApp({ db, config });

module.exports = {
    crearAppPrueba,
    crearConfigPrueba,
    crearDbPrueba,
    ejecutarSolicitud
};
