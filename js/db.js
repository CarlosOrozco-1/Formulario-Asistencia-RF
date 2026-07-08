// Extraemos los miembros y departamentos iniciales del ámbito global window
const { INITIAL_MEMBERS, PUEBLO_INITIAL } = window;

/**
 * Convierte un Uint8Array a una cadena Base64 para guardarlo en localStorage
 * @param {Uint8Array} arr 
 * @returns {string}
 */
window.uint8ArrayToBase64 = function(arr) {
    // Variable para acumular la cadena binaria
    let binary = '';
    // Guardamos la longitud para el bucle
    const len = arr.byteLength;
    // Recorremos el array byte por byte
    for (let i = 0; i < len; i++) {
        // Concatenamos el caracter correspondiente al código de byte
        binary += String.fromCharCode(arr[i]);
    }
    // Retornamos la cadena codificada en Base64
    return window.btoa(binary);
};

/**
 * Convierte una cadena Base64 a Uint8Array para reconstruir la base de datos
 * @param {string} base64 
 * @returns {Uint8Array}
 */
window.base64ToUint8Array = function(base64) {
    // Decodificamos la cadena Base64 a binario
    const binaryString = window.atob(base64);
    // Guardamos la longitud del binario
    const len = binaryString.length;
    // Creamos el array de bytes con la longitud correspondiente
    const bytes = new Uint8Array(len);
    // Asignamos el valor de cada caracter al array de bytes
    for (let i = 0; i < len; i++) {
        // Convertimos el caracter a su código ASCII/byte correspondiente
        bytes[i] = binaryString.charCodeAt(i);
    }
    // Retornamos el array de bytes
    return bytes;
};

/**
 * Guarda el estado actual de la base de datos en localStorage
 * @param {Database} db - Instancia de la base de datos
 */
window.saveDatabase = function(db) {
    // Si la instancia de la base de datos no es válida, salimos
    if (!db) return;
    try {
        // Exportamos los datos de SQLite a un array de bytes
        const data = db.export();
        // Convertimos el array a Base64 para guardarlo como texto
        const base64 = window.uint8ArrayToBase64(data);
        // Almacenamos los datos codificados en el localStorage del navegador
        localStorage.setItem('asistencia_db', base64);
        // Guardamos una marca de tiempo para verificar la expiración diaria
        localStorage.setItem('asistencia_db_timestamp', Date.now().toString());
    } catch (e) {
        // Imprimimos en consola en caso de fallo al persistir datos
        console.error("Error al guardar la base de datos:", e);
    }
};

/**
 * Inicializa la base de datos SQLite en el navegador
 * Intenta cargar una base de datos guardada o crea una nueva
 * @returns {Promise<Database>} Instancia de la base de datos
 */
window.initDB = async function() {
    // Inicializar SQL.js cargando el archivo WebAssembly desde CDN
    const SQL = await initSqlJs({ 
        locateFile: file => `https://unpkg.com/sql.js@1.8.0/dist/${file}` 
    });
    
    // Declaración de la variable de base de datos
    let db;
    // Intentamos obtener la base de datos codificada guardada
    const savedData = localStorage.getItem('asistencia_db');
    // Obtenemos la marca de tiempo del último guardado
    const savedTimestamp = localStorage.getItem('asistencia_db_timestamp');
    // Marca de tiempo actual para control de expiración
    const now = Date.now();
    // Milisegundos que representan 24 horas exactas
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Si existen datos guardados en el almacenamiento local
    if (savedData) {
        try {
            // Reconstruimos el array de bytes desde la cadena Base64
            const bytes = window.base64ToUint8Array(savedData);
            // Creamos la instancia de la base de datos con los bytes recuperados
            db = new SQL.Database(bytes);
            
            // Si pasaron más de 24 horas desde el último registro
            if (savedTimestamp && (now - parseInt(savedTimestamp) > twentyFourHours)) {
                // Reiniciamos las cantidades de asistencia del pueblo a cero
                db.run("UPDATE pueblo SET cantidad = 0");
                // Persistimos los cambios del reinicio en localStorage
                window.saveDatabase(db);
            }
        } catch (e) {
            // En caso de fallo al recuperar, creamos una base de datos vacía
            console.error("Error al cargar base de datos guardada:", e);
            db = new SQL.Database();
        }
    } else {
        // Si no existen datos previos, creamos una instancia limpia
        db = new SQL.Database();
    }
    
    // Creamos la tabla de discípulos si no existe en la base de datos
    db.run(`
        CREATE TABLE IF NOT EXISTS discipulos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE,
            orden INTEGER DEFAULT 0
        )
    `);

    try {
        // Agregamos la columna orden en bases de datos ya existentes para permitir reordenación
        db.run("ALTER TABLE discipulos ADD COLUMN orden INTEGER DEFAULT 0");
    } catch (err) {
        // Controlamos el error si la columna orden ya se encuentra creada en la tabla
    }
    
    // Creamos la tabla de asistencia del discipulado si no existe
    db.run(`
        CREATE TABLE IF NOT EXISTS asistencia_discipulado (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discipulo_id INTEGER,
            fecha TEXT,
            estado TEXT,
            FOREIGN KEY(discipulo_id) REFERENCES discipulos(id)
        )
    `);
    
    // Creamos la tabla pueblo para almacenar categorías y conteos rápidos
    db.run(`
        CREATE TABLE IF NOT EXISTS pueblo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT UNIQUE,
            cantidad INTEGER DEFAULT 0
        )
    `);
    
    // Creamos la tabla de asistencia histórica del pueblo si no existe
    db.run(`
        CREATE TABLE IF NOT EXISTS asistencia_pueblo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pueblo_id INTEGER,
            fecha TEXT,
            cantidad INTEGER,
            FOREIGN KEY(pueblo_id) REFERENCES pueblo(id)
        )
    `);

    // Validamos e insertamos cada miembro inicial si no existe en la base de datos
    INITIAL_MEMBERS.forEach((n, idx) => {
        // Comprobamos si el miembro ya está registrado en la tabla discipulos
        const check = db.exec("SELECT id FROM discipulos WHERE nombre = ?", [n]);
        // Si no está registrado en la base de datos
        if (check.length === 0 || check[0].values.length === 0) {
            // Registramos el nuevo miembro asignándole su orden secuencial inicial
            db.run("INSERT INTO discipulos (nombre, orden) VALUES (?, ?)", [n, idx]);
        }
    });

    // Validamos e insertamos cada departamento inicial si no existe para habilitar nuevos
    PUEBLO_INITIAL.forEach(p => {
        // Comprobamos si el departamento ya existe en la tabla pueblo
        const check = db.exec("SELECT id FROM pueblo WHERE nombre = ?", [p.nombre]);
        // Si el departamento no está registrado en la base de datos
        if (check.length === 0 || check[0].values.length === 0) {
            // Agregamos el departamento con cantidad inicial a cero
            db.run("INSERT INTO pueblo (nombre, cantidad) VALUES (?, ?)", [p.nombre, 0]);
        }
    });

    // Guardamos la base de datos actualizada para persistir cambios
    window.saveDatabase(db);

    // Retornamos la instancia de base de datos inicializada
    return db;
};
