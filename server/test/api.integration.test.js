/**
 * Pruebas de integración de la API en memoria, sin abrir puertos locales.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const {
    crearAppPrueba,
    crearConfigPrueba,
    crearDbPrueba,
    ejecutarSolicitud
} = require('./helpers');

// Devuelve la fecha institucional actual para que el resumen del tablero sea determinista.
const obtenerFechaNegocio = (timeZone) => new Intl.DateTimeFormat('fr-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).format(new Date());

// Inserta un usuario no administrador, un grupo, un miembro y una categoría de prueba.
const sembrarDatos = (db) => {
    const passwordHash = bcrypt.hashSync('clave123', 10);
    db.prepare(`
        INSERT INTO usuarios (username, password_hash, nombre, rol)
        VALUES (?, ?, ?, ?)
    `).run('operador', passwordHash, 'Operador', 'user');

    const grupoId = db.prepare(`
        INSERT INTO grupos_discipulado (nombre, lugar)
        VALUES (?, ?)
    `).run('Grupo Norte', 'Sala 1').lastInsertRowid;

    const miembroId = db.prepare(`
        INSERT INTO miembros (nombre, tipo, grupo_id)
        VALUES (?, ?, ?)
    `).run('Ana Pérez', 'discipulado', grupoId).lastInsertRowid;

    const categoriaId = db.prepare(`
        INSERT INTO categorias (nombre)
        VALUES (?)
    `).run('Alabanza').lastInsertRowid;

    return {
        categoriaId,
        grupoId,
        miembroId
    };
};

// Ejecuta una solicitud HTTP simulada y devuelve el cuerpo JSON cuando aplica.
const requestJson = async (app, path, options = {}) => {
    const respuesta = await ejecutarSolicitud(app, {
        path,
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: options.body
    });
    const bodyText = respuesta.getBodyText();
    return {
        response: respuesta,
        body: bodyText ? JSON.parse(bodyText) : null
    };
};

// Cubre autenticación, permisos, validación y resumen del tablero sin salir del proceso.
test('la API protege rutas, acepta escrituras y publica métricas del tablero', async (t) => {
    const db = crearDbPrueba();
    const semillas = sembrarDatos(db);
    const config = crearConfigPrueba();
    const app = crearAppPrueba(db, config);

    t.after(() => {
        db.close();
    });

    // Verifica que el healthcheck y las cabeceras defensivas estén disponibles desde el arranque.
    const healthResponse = await requestJson(app, '/healthz');
    assert.equal(healthResponse.response.statusCode, 200);
    assert.equal(healthResponse.body.status, 'ok');
    assert.equal(healthResponse.body.database, 'ok');
    assert.equal(
        healthResponse.response.getHeader('x-content-type-options'),
        'nosniff'
    );

    // Inicia sesión como administrador para obtener un JWT utilizable en el resto del flujo.
    const loginAdmin = await requestJson(app, '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
        })
    });
    assert.equal(loginAdmin.response.statusCode, 200);
    assert.ok(loginAdmin.body.token);

    const adminToken = loginAdmin.body.token;

    // Verifica que la restauración de sesión use el mismo contrato que el login.
    const meResponse = await requestJson(app, '/api/auth/me', {
        headers: {
            Authorization: `Bearer ${adminToken}`
        }
    });
    assert.equal(meResponse.response.statusCode, 200);
    assert.equal(meResponse.body.usuario.username, 'admin');

    // Crea una asistencia de Discipulado para que el tablero pueda reflejar un registro real.
    const fechaNegocio = obtenerFechaNegocio(config.businessTimeZone);
    const asistenciaDiscipulado = await requestJson(app, '/api/asistencias', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            miembro_id: semillas.miembroId,
            fecha: fechaNegocio,
            tipo: 'discipulado',
            estado: 'presente'
        })
    });
    assert.equal(asistenciaDiscipulado.response.statusCode, 201);
    assert.ok(asistenciaDiscipulado.body.id);

    // Crea una asistencia de Pueblo para validar el conteo por cantidad de personas.
    const asistenciaPueblo = await requestJson(app, '/api/asistencias', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            categoria_id: semillas.categoriaId,
            fecha: fechaNegocio,
            tipo: 'pueblo',
            cantidad: 4,
            servicio: 'Unico'
        })
    });
    assert.equal(asistenciaPueblo.response.statusCode, 201);
    assert.ok(asistenciaPueblo.body.id);

    // Comprueba que el resumen exponga tanto registros como personas sin ambigüedad.
    const resumenResponse = await requestJson(app, '/api/asistencias/resumen', {
        headers: {
            Authorization: `Bearer ${adminToken}`
        }
    });
    assert.equal(resumenResponse.response.statusCode, 200);
    assert.equal(resumenResponse.body.registrosHoy, 2);
    assert.equal(resumenResponse.body.asistenciasHoy, 2);
    assert.equal(resumenResponse.body.personasHoy, 5);
    assert.equal(
        resumenResponse.body.personasPorTipo.find(item => item.tipo === 'discipulado').total,
        1
    );
    assert.equal(
        resumenResponse.body.personasPorTipo.find(item => item.tipo === 'pueblo').total,
        4
    );

    // Valida el control de permisos con un usuario autenticado pero sin rol administrador.
    const loginUsuario = await requestJson(app, '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            username: 'operador',
            password: 'clave123'
        })
    });
    assert.equal(loginUsuario.response.statusCode, 200);

    const usuariosResponse = await requestJson(app, '/api/usuarios', {
        headers: {
            Authorization: `Bearer ${loginUsuario.body.token}`
        }
    });
    assert.equal(usuariosResponse.response.statusCode, 403);
    assert.equal(usuariosResponse.body.error.code, 'FORBIDDEN');

    // Asegura que el contrato de errores diferencie JSON inválido y rutas protegidas sin token.
    const invalidJsonResponse = await requestJson(app, '/api/auth/login', {
        method: 'POST',
        body: '{'
    });
    assert.equal(invalidJsonResponse.response.statusCode, 400);
    assert.equal(invalidJsonResponse.body.error.code, 'INVALID_JSON');

    const sinTokenResponse = await requestJson(app, '/api/asistencias/resumen');
    assert.equal(sinTokenResponse.response.statusCode, 401);
    assert.equal(sinTokenResponse.body.error.code, 'AUTH_REQUIRED');
});
