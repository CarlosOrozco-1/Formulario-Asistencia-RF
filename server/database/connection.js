/**
 * Conexión a la base de datos SQLite
 * 
 * Inicializa better-sqlite3 con el archivo .db en el servidor.
 * Ejecuta el schema SQL si la base de datos está vacía.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function conectarDB() {
    const dbPath = path.join(__dirname, 'asistencias.db');
    const db = new Database(dbPath);

    // Habilitar WAL para mejor rendimiento
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    db.exec(initSQL);

    console.log('✅ Base de datos conectada:', dbPath);
    return db;
}

module.exports = { conectarDB };
