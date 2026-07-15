/**
 * Validadores compartidos para normalizar entradas antes de ejecutar consultas SQL.
 */
const { validationError } = require('./http-error');

// Normaliza texto y aplica presencia y longitud para evitar valores vacíos o excesivos.
const validarTexto = (value, field, options = {}) => {
    const { required = false, max = 120, trim = true } = options;

    // Permite omitir campos opcionales sin convertirlos accidentalmente en texto.
    if (value === undefined || value === null) {
        if (required) throw validationError(field, 'Este campo es requerido');
        return null;
    }

    // Rechaza tipos inesperados para conservar un contrato JSON explícito.
    if (typeof value !== 'string') {
        throw validationError(field, 'Debe ser texto');
    }

    const normalized = trim ? value.trim() : value;
    if (required && !normalized) throw validationError(field, 'Este campo es requerido');
    if (normalized.length > max) throw validationError(field, `Admite máximo ${max} caracteres`);
    return normalized || null;
};

// Convierte identificadores a enteros positivos para impedir valores ambiguos en consultas.
const validarId = (value, field = 'id', required = true) => {
    if ((value === undefined || value === null || value === '') && !required) return null;
    const normalized = Number(value);
    if (!Number.isInteger(normalized) || normalized <= 0) {
        throw validationError(field, 'Debe ser un identificador entero positivo');
    }
    return normalized;
};

// Valida cantidades y posiciones enteras dentro de límites razonables para el dominio.
const validarEntero = (value, field, options = {}) => {
    const { required = false, min = 0, max = 100000 } = options;
    if ((value === undefined || value === null || value === '') && !required) return null;
    const normalized = Number(value);
    if (!Number.isInteger(normalized) || normalized < min || normalized > max) {
        throw validationError(field, `Debe ser un entero entre ${min} y ${max}`);
    }
    return normalized;
};

// Exige fechas calendario reales con el formato estable que utiliza SQLite.
const validarFecha = (value, field = 'fecha', required = false) => {
    if ((value === undefined || value === null || value === '') && !required) return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw validationError(field, 'Debe usar el formato YYYY-MM-DD');
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const isRealDate = date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
    if (!isRealDate) throw validationError(field, 'Debe ser una fecha válida');
    return value;
};

// Restringe valores categóricos a las opciones reconocidas por el negocio.
const validarEnum = (value, field, allowed, required = false) => {
    if ((value === undefined || value === null || value === '') && !required) return null;
    if (!allowed.includes(value)) {
        throw validationError(field, `Debe ser uno de: ${allowed.join(', ')}`);
    }
    return value;
};

// Normaliza indicadores booleanos a los valores cero y uno que persiste SQLite.
const validarBooleano = (value, field, required = false) => {
    if ((value === undefined || value === null || value === '') && !required) return null;
    if (![true, false, 1, 0, '1', '0'].includes(value)) {
        throw validationError(field, 'Debe ser un valor booleano');
    }
    return value === true || value === 1 || value === '1' ? 1 : 0;
};

module.exports = {
    validarBooleano,
    validarEntero,
    validarEnum,
    validarFecha,
    validarId,
    validarTexto
};
