/**
 * Punto de entrada del proceso: carga infraestructura y abre el puerto HTTP.
 */
// Carga el entorno antes de importar configuración o módulos que dependan de él.
require('dotenv').config();

const { crearApp } = require('./app');
const { cargarConfig } = require('./config');
const { conectarDB } = require('./database/connection');

// Compone dependencias reales únicamente en el borde de la aplicación.
const config = cargarConfig();
const db = conectarDB();
const app = crearApp({ db, config });

// Inicia el proceso HTTP con la configuración validada.
app.listen(config.port, '0.0.0.0', () => {
    console.log(`✅ Servidor corriendo en http://0.0.0.0:${config.port}`);
});
