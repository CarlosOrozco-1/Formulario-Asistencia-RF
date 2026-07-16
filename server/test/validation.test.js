/**
 * Pruebas unitarias de validadores y errores controlados.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { HttpError, validationError } = require('../utils/http-error');
const {
    validarFecha,
    validarId,
    validarTexto
} = require('../utils/validation');

// Verifica que el texto se normalice y conserve el contrato de presencia.
test('validarTexto recorta valores y respeta campos opcionales', () => {
    assert.equal(validarTexto('  texto  ', 'campo', { required: true }), 'texto');
    assert.equal(validarTexto(undefined, 'campo', { required: false }), null);
});

// Verifica que los identificadores y fechas inválidas se rechacen antes de llegar a SQLite.
test('validarId y validarFecha rechazan valores inconsistentes', () => {
    assert.equal(validarId('7', 'id'), 7);
    assert.throws(() => validarId('0', 'id'), HttpError);
    assert.equal(validarFecha('2026-07-16', 'fecha', true), '2026-07-16');
    assert.throws(() => validarFecha('2026-02-29', 'fecha', true), HttpError);
});

// Confirma que el error de validación mantenga el formato común de la API.
test('validationError conserva el contrato HTTP compartido', () => {
    const error = validationError('fecha', 'Debe usar el formato YYYY-MM-DD');
    assert.equal(error.status, 400);
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.equal(error.message, 'Los datos enviados no son válidos');
    assert.deepEqual(error.details, [{
        field: 'fecha',
        message: 'Debe usar el formato YYYY-MM-DD'
    }]);
});
