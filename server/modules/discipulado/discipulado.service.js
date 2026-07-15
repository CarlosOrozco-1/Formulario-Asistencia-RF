/**
 * Casos de uso de grupos y miembros de discipulado.
 */
const { HttpError, validationError } = require('../../utils/http-error');
const {
    validarBooleano,
    validarEntero,
    validarEnum,
    validarId,
    validarTexto
} = require('../../utils/validation');

const asegurarCambio = (result, code, message) => {
    if (!result.changes) throw new HttpError(404, code, message);
};

const crearDiscipuladoService = (repository) => ({
    listGroups: () => repository.listGroups(),
    createGroup: (body) => {
        const result = repository.createGroup({
            nombre: validarTexto(body.nombre, 'nombre', { required: true, max: 120 }),
            lugar: validarTexto(body.lugar, 'lugar', { max: 180 })
        });
        return { success: true, id: result.lastInsertRowid };
    },
    updateGroup: (idValue, body) => {
        if ([body.nombre, body.lugar, body.activo, body.orden].every(
            value => value === undefined
        )) {
            throw validationError('body', 'Debe incluir al menos un campo para actualizar');
        }
        const result = repository.updateGroup({
            id: validarId(idValue),
            nombre: validarTexto(body.nombre, 'nombre', {
                required: body.nombre !== undefined,
                max: 120
            }),
            lugar: validarTexto(body.lugar, 'lugar', { max: 180 }),
            activo: validarBooleano(body.activo, 'activo'),
            orden: validarEntero(body.orden, 'orden', { min: 0, max: 10000 })
        });
        asegurarCambio(result, 'GROUP_NOT_FOUND', 'El grupo no existe');
        return { success: true };
    },
    deleteGroup: (idValue) => {
        const result = repository.deleteGroup(validarId(idValue));
        asegurarCambio(result, 'GROUP_NOT_FOUND', 'El grupo no existe');
        return { success: true };
    },
    listMembers: (query) => repository.listMembers({
        tipo: validarEnum(query.tipo, 'tipo', ['discipulado', 'pueblo']),
        grupoId: validarId(query.grupo_id, 'grupo_id', false),
        activo: validarBooleano(query.activo, 'activo')
    }),
    createMember: (body) => {
        const result = repository.createMember({
            nombre: validarTexto(body.nombre, 'nombre', { required: true, max: 150 }),
            tipo: validarEnum(body.tipo, 'tipo', ['discipulado', 'pueblo'], true),
            grupoId: validarId(body.grupo_id, 'grupo_id', false)
        });
        return { success: true, id: result.lastInsertRowid };
    },
    updateMember: (idValue, body) => {
        const hasGroupId = Object.prototype.hasOwnProperty.call(body, 'grupo_id');
        if ([body.nombre, body.activo, body.orden].every(
            value => value === undefined
        ) && !hasGroupId) {
            throw validationError('body', 'Debe incluir al menos un campo para actualizar');
        }
        const result = repository.updateMember({
            id: validarId(idValue),
            nombre: validarTexto(body.nombre, 'nombre', {
                required: body.nombre !== undefined,
                max: 150
            }),
            hasGroupId,
            grupoId: body.grupo_id === null
                ? null
                : validarId(body.grupo_id, 'grupo_id', false),
            activo: validarBooleano(body.activo, 'activo'),
            orden: validarEntero(body.orden, 'orden', { min: 0, max: 10000 })
        });
        asegurarCambio(result, 'MEMBER_NOT_FOUND', 'El miembro no existe');
        return { success: true };
    },
    deleteMember: (idValue) => {
        const result = repository.deleteMember(validarId(idValue));
        asegurarCambio(result, 'MEMBER_NOT_FOUND', 'El miembro no existe');
        return { success: true };
    }
});

module.exports = { crearDiscipuladoService };
