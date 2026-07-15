/**
 * Casos de uso compartidos por los accesos público y protegido de Pueblo.
 */
const { HttpError, validationError } = require('../../utils/http-error');
const {
    validarBooleano,
    validarEntero,
    validarFecha,
    validarId,
    validarTexto
} = require('../../utils/validation');

// Uniforma la respuesta cuando una categoría solicitada no existe.
const asegurarCambioCategoria = (result) => {
    if (!result.changes) {
        throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'La categoría no existe');
    }
};

const crearPuebloService = (repository) => ({
    listCategories: () => repository.listCategories(),
    createCategory: (body) => {
        const nombre = validarTexto(body.nombre, 'nombre', { required: true, max: 120 });
        const result = repository.createCategory(nombre);
        return { success: true, id: result.lastInsertRowid };
    },
    updateCategory: (idValue, body) => {
        if (body.nombre === undefined && body.activo === undefined) {
            throw validationError('body', 'Debe incluir nombre o activo');
        }
        const result = repository.updateCategory({
            id: validarId(idValue),
            nombre: validarTexto(body.nombre, 'nombre', {
                required: body.nombre !== undefined,
                max: 120
            }),
            activo: validarBooleano(body.activo, 'activo')
        });
        asegurarCambioCategoria(result);
        return { success: true };
    },
    deactivateCategory: (idValue) => {
        const result = repository.deactivateCategory(validarId(idValue));
        asegurarCambioCategoria(result);
        return { success: true };
    },
    registerAttendance: (body) => {
        const categoriaId = validarId(body.categoria_id, 'categoria_id');
        const fecha = validarFecha(body.fecha, 'fecha', true);
        const cantidad = validarEntero(body.cantidad ?? 1, 'cantidad', {
            required: true,
            min: 1,
            max: 100000
        });
        const servicio = validarTexto(body.servicio, 'servicio', { max: 80 });
        if (!repository.findActiveCategory(categoriaId)) {
            throw new HttpError(
                404,
                'CATEGORY_NOT_FOUND',
                'La categoría indicada no está disponible'
            );
        }
        const result = repository.createAttendance({
            categoriaId,
            fecha,
            cantidad,
            servicio
        });
        return { success: true, id: result.lastInsertRowid };
    },
    listReports: (query) => repository.listReports({
        fecha: validarFecha(query.fecha),
        categoriaId: validarId(query.categoria_id, 'categoria_id', false)
    })
});

module.exports = { crearPuebloService };
