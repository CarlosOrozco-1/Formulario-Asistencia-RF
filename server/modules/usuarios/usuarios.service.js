/**
 * Casos de uso administrativos de usuarios.
 */
const bcrypt = require('bcryptjs');
const { HttpError, validationError } = require('../../utils/http-error');
const {
    validarBooleano,
    validarEnum,
    validarId,
    validarTexto
} = require('../../utils/validation');

const asegurarCambio = (result) => {
    if (!result.changes) throw new HttpError(404, 'USER_NOT_FOUND', 'El usuario no existe');
};

const validarPassword = (value) => {
    const password = validarTexto(value, 'password', {
        required: true,
        max: 200,
        trim: false
    });
    if (password.length < 8) {
        throw validationError('password', 'Debe contener al menos 8 caracteres');
    }
    return password;
};

const crearUsuariosService = (repository) => ({
    list: () => repository.list(),
    create: (body) => {
        const username = validarTexto(body.username, 'username', { required: true, max: 80 });
        const password = validarPassword(body.password);
        const nombre = validarTexto(body.nombre, 'nombre', { required: true, max: 150 });
        const rol = validarEnum(body.rol ?? 'user', 'rol', ['user', 'admin'], true);
        const result = repository.create({
            username,
            passwordHash: bcrypt.hashSync(password, 10),
            nombre,
            rol
        });
        return { success: true, id: result.lastInsertRowid };
    },
    update: (idValue, body) => {
        if ([body.nombre, body.rol, body.activo].every(value => value === undefined)) {
            throw validationError('body', 'Debe incluir al menos un campo para actualizar');
        }
        const result = repository.update({
            id: validarId(idValue),
            nombre: validarTexto(body.nombre, 'nombre', {
                required: body.nombre !== undefined,
                max: 150
            }),
            rol: validarEnum(body.rol, 'rol', ['user', 'admin']),
            activo: validarBooleano(body.activo, 'activo')
        });
        asegurarCambio(result);
        return { success: true };
    },
    updatePassword: (idValue, body) => {
        const result = repository.updatePassword({
            id: validarId(idValue),
            passwordHash: bcrypt.hashSync(validarPassword(body.password), 10)
        });
        asegurarCambio(result);
        return { success: true };
    },
    deactivate: (idValue) => {
        const result = repository.deactivate(validarId(idValue));
        asegurarCambio(result);
        return { success: true };
    }
});

module.exports = { crearUsuariosService };
