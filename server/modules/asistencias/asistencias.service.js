/**
 * Casos de uso y reglas de negocio del registro de asistencias.
 */
const { HttpError, validationError } = require('../../utils/http-error');
const {
    validarEntero,
    validarEnum,
    validarFecha,
    validarId,
    validarTexto
} = require('../../utils/validation');

const ESTADOS = ['presente', 'reportado', 'ausente'];
const TIPOS = ['discipulado', 'pueblo'];

// Calcula el día institucional con la zona horaria inyectada por configuración.
const obtenerFechaNegocio = (zonaHoraria) => new Intl.DateTimeFormat('fr-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
}).format(new Date());

const asegurarCambio = (result) => {
    if (!result.changes) {
        throw new HttpError(404, 'ATTENDANCE_NOT_FOUND', 'La asistencia no existe');
    }
};

// Verifica que la carga grupal represente exactamente a los miembros activos del grupo.
const validarCargaGrupal = (repository, grupoId, body) => {
    if (!Array.isArray(body.asistencias)) {
        throw validationError('asistencias', 'Debe ser una lista');
    }
    if (!repository.findActiveGroup(grupoId)) {
        throw new HttpError(404, 'GROUP_NOT_FOUND', 'El grupo no está disponible');
    }
    const asistencias = body.asistencias.map((item, index) => ({
        miembroId: validarId(item?.miembro_id, `asistencias[${index}].miembro_id`),
        estado: validarEnum(item?.estado, `asistencias[${index}].estado`, ESTADOS, true)
    }));
    const submittedIds = asistencias.map(item => item.miembroId);
    if (new Set(submittedIds).size !== submittedIds.length) {
        throw validationError('asistencias', 'No puede incluir miembros duplicados');
    }
    const activeIds = repository.listActiveGroupMembers(grupoId).map(item => item.id);
    const sameMembers = activeIds.length === submittedIds.length
        && activeIds.every(id => submittedIds.includes(id));
    if (!sameMembers) {
        throw validationError(
            'asistencias',
            'Debe incluir exactamente los miembros activos del grupo'
        );
    }
    return asistencias;
};

const crearAsistenciasService = (repository, config) => ({
    list: (query) => repository.list({
        fecha: validarFecha(query.fecha),
        tipo: validarEnum(query.tipo, 'tipo', TIPOS),
        miembroId: validarId(query.miembro_id, 'miembro_id', false)
    }),
    create: (body, usuarioId) => {
        const data = {
            miembroId: validarId(body.miembro_id, 'miembro_id', false),
            categoriaId: validarId(body.categoria_id, 'categoria_id', false),
            grupoId: validarId(body.grupo_id, 'grupo_id', false),
            fecha: validarFecha(body.fecha, 'fecha', true),
            tipo: validarEnum(body.tipo, 'tipo', TIPOS, true),
            estado: validarEnum(body.estado, 'estado', ESTADOS),
            cantidad: validarEntero(body.cantidad ?? 1, 'cantidad', {
                required: true,
                min: 1,
                max: 100000
            }),
            servicio: validarTexto(body.servicio, 'servicio', { max: 80 }),
            grupoServidores: validarTexto(
                body.grupo_servidores,
                'grupo_servidores',
                { max: 180 }
            ),
            registradoPor: usuarioId
        };
        if (data.tipo === 'discipulado' && (!data.miembroId || !data.estado)) {
            throw validationError(
                'miembro_id',
                'Discipulado requiere miembro_id y estado'
            );
        }
        if (data.tipo === 'pueblo' && !data.categoriaId) {
            throw validationError('categoria_id', 'Pueblo requiere una categoría');
        }
        if (data.tipo === 'discipulado') {
            const miembro = repository.findActiveMember(data.miembroId);
            if (!miembro) {
                throw new HttpError(404, 'MEMBER_NOT_FOUND', 'El miembro no está disponible');
            }
            if (data.grupoId && miembro.grupo_id !== data.grupoId) {
                throw validationError('grupo_id', 'El miembro no pertenece al grupo indicado');
            }
        }
        if (data.tipo === 'pueblo' && !repository.findActiveCategory(data.categoriaId)) {
            throw new HttpError(
                404,
                'CATEGORY_NOT_FOUND',
                'La categoría no está disponible'
            );
        }
        const result = repository.create(data);
        return { success: true, id: result.lastInsertRowid };
    },
    update: (idValue, body) => {
        const updates = [];
        if (body.estado !== undefined) {
            updates.push({
                column: 'estado',
                value: validarEnum(body.estado, 'estado', ESTADOS)
            });
        }
        if (body.cantidad !== undefined) {
            updates.push({
                column: 'cantidad',
                value: validarEntero(body.cantidad, 'cantidad', {
                    required: true,
                    min: 1,
                    max: 100000
                })
            });
        }
        if (body.servicio !== undefined) {
            updates.push({
                column: 'servicio',
                value: validarTexto(body.servicio, 'servicio', { max: 80 })
            });
        }
        if (body.grupo_servidores !== undefined) {
            updates.push({
                column: 'grupo_servidores',
                value: validarTexto(body.grupo_servidores, 'grupo_servidores', {
                    max: 180
                })
            });
        }
        if (!updates.length) {
            throw validationError('body', 'Debe incluir al menos un campo para actualizar');
        }
        const result = repository.update({ id: validarId(idValue), updates });
        asegurarCambio(result);
        return { success: true };
    },
    delete: (idValue) => {
        const result = repository.delete(validarId(idValue));
        asegurarCambio(result);
        return { success: true };
    },
    replaceGroupAttendance: (grupoIdValue, body, usuarioId) => {
        const grupoId = validarId(grupoIdValue, 'grupo_id');
        const fecha = validarFecha(body.fecha, 'fecha', true);
        const asistencias = validarCargaGrupal(repository, grupoId, body);
        const total = repository.replaceGroupAttendance({
            grupoId,
            fecha,
            asistencias,
            registradoPor: usuarioId
        });
        return { success: true, total };
    },
    getSummary: () => repository.getSummary(
        obtenerFechaNegocio(config.businessTimeZone)
    )
});

module.exports = { crearAsistenciasService };
