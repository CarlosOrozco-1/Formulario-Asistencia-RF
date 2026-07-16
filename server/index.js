/**
 * Punto de entrada del proceso: carga infraestructura y abre el puerto HTTP.
 */
// Carga el entorno antes de importar configuración o módulos que dependan de él.
require('dotenv').config();

const { crearApp } = require('./app');
const { cargarConfig } = require('./config');
const { conectarDB } = require('./database/connection');
const { registrarInfo } = require('./utils/logger');

// Compone dependencias reales únicamente en el borde de la aplicación.
const config = cargarConfig();
const db = conectarDB();
const app = crearApp({ db, config });
const server = app.listen(config.port, '0.0.0.0', () => {
    registrarInfo('Servidor iniciado', {
        port: config.port,
        host: '0.0.0.0'
    });
});

// Cierra el servidor y la base cuando el contenedor o el proceso recibe una señal.
const cerrarAplicacion = (signal) => {
    registrarInfo('Apagado solicitado', { signal });
    server.close(() => {
        db.close();
        registrarInfo('Servidor detenido y base de datos cerrada');
        process.exit(0);
    });
};

// Mantiene un apagado limpio para despliegues en Docker y balanceadores.
process.once('SIGINT', () => cerrarAplicacion('SIGINT'));
process.once('SIGTERM', () => cerrarAplicacion('SIGTERM'));
