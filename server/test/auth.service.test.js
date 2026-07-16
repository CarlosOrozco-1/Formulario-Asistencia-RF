/**
 * Pruebas unitarias del caso de uso de autenticación.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { HttpError } = require('../utils/http-error');
const { crearAuthService } = require('../modules/auth/auth.service');

// Construye un repositorio falso para concentrar la prueba en la lógica de negocio.
const crearRepositorioFalso = (usuario) => {
    let ultimoAcceso = null;

    return {
        findActiveByUsername: (username) => (
            username === usuario.username ? usuario : null
        ),
        findActiveIdentityById: (id) => (
            id === usuario.id
                ? {
                    id: usuario.id,
                    username: usuario.username,
                    nombre: usuario.nombre,
                    rol: usuario.rol
                }
                : null
        ),
        updateLastAccess: (id, timestamp) => {
            if (id === usuario.id) ultimoAcceso = timestamp;
        },
        getUltimoAcceso: () => ultimoAcceso
    };
};

// Valida que el login emita JWT y actualice el acceso del usuario activo.
test('login emite una sesión válida para credenciales correctas', () => {
    const usuario = {
        id: 7,
        username: 'operador',
        nombre: 'Operador',
        rol: 'user',
        password_hash: bcrypt.hashSync('clave123', 10)
    };
    const repository = crearRepositorioFalso(usuario);
    const service = crearAuthService({ repository, jwtSecret: 'test-secret' });

    const resultado = service.login({
        username: 'operador',
        password: 'clave123'
    });

    const identidad = jwt.verify(resultado.token, 'test-secret');
    assert.equal(identidad.id, usuario.id);
    assert.equal(identidad.username, usuario.username);
    assert.equal(identidad.rol, usuario.rol);
    assert.equal(resultado.usuario.nombre, usuario.nombre);
    assert.ok(repository.getUltimoAcceso());
});

// Comprueba que las credenciales inválidas no filtren detalles internos.
test('login rechaza credenciales incorrectas con error controlado', () => {
    const usuario = {
        id: 7,
        username: 'operador',
        nombre: 'Operador',
        rol: 'user',
        password_hash: bcrypt.hashSync('clave123', 10)
    };
    const repository = crearRepositorioFalso(usuario);
    const service = crearAuthService({ repository, jwtSecret: 'test-secret' });

    assert.throws(() => {
        service.login({
            username: 'operador',
            password: 'incorrecta'
        });
    }, error => error instanceof HttpError && error.code === 'INVALID_CREDENTIALS');
});

// Confirma que una identidad sin usuario activo no se restaure silenciosamente.
test('getSession rechaza usuarios que ya no están activos', () => {
    const repository = crearRepositorioFalso({
        id: 7,
        username: 'operador',
        nombre: 'Operador',
        rol: 'user',
        password_hash: bcrypt.hashSync('clave123', 10)
    });
    const service = crearAuthService({ repository, jwtSecret: 'test-secret' });

    assert.throws(() => {
        service.getSession({ id: 99 });
    }, error => error instanceof HttpError && error.code === 'SESSION_UNAVAILABLE');
});
