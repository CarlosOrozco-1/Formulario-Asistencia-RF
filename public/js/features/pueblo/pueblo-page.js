// Módulo funcional de Pueblo separado por responsabilidad de negocio.
window.Features = window.Features || {};

// Centraliza la carga inicial para que la vista se concentre en interacción y estados.
const usePuebloPage = () => {
    const [vista, setVista] = React.useState('categorias');
    const [categorias, setCategorias] = React.useState([]);
    const [asistencias, setAsistencias] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [fecha, setFecha] = React.useState(helpers.today());

    // Trae las categorías activas sin bloquear la navegación una vez cargadas.
    React.useEffect(() => {
        let active = true;
        api.getCategorias().then(data => {
            if (!active) return;
            setCategorias(data || []);
            setLoading(false);
        }).catch(() => {
            if (!active) return;
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    return {
        vista,
        setVista,
        categorias,
        setCategorias,
        asistencias,
        setAsistencias,
        loading,
        fecha,
        setFecha
    };
};

// Exporta el punto de entrada del módulo para mantener el contrato con el orquestador.
window.PuebloComponent = function PuebloComponent() {
    const page = usePuebloPage();

    if (page.loading) {
        return (
            <StatusState
                type="loading"
                title="Cargando categorías"
                description="Estamos preparando la información de Pueblo."
            />
        );
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-6">
            {page.vista === 'categorias' && (
                <VistaCategorias
                    categorias={page.categorias}
                    setCategorias={page.setCategorias}
                    onAsistencia={() => page.setVista('asistencia')}
                    onReportes={() => page.setVista('reportes')}
                />
            )}
            {page.vista === 'asistencia' && (
                <VistaAsistenciaPueblo
                    categorias={page.categorias}
                    fecha={page.fecha}
                    setFecha={page.setFecha}
                    onBack={() => page.setVista('categorias')}
                />
            )}
            {page.vista === 'reportes' && (
                <VistaReportesPueblo
                    categorias={page.categorias}
                    onBack={() => page.setVista('categorias')}
                />
            )}
        </main>
    );
};

// Listado de categorías con acciones para crear, eliminar y saltar entre vistas.
function VistaCategorias({ categorias, setCategorias, onAsistencia, onReportes }) {
    const { notify, confirm } = window.useFeedback();
    const [showForm, setShowForm] = React.useState(false);
    const [nombre, setNombre] = React.useState('');

    // Crea una categoría nueva y mantiene el formulario abierto si el servidor la rechaza.
    const handleCreate = async event => {
        event.preventDefault();
        if (!nombre.trim()) return;
        try {
            const res = await api.createCategoria({ nombre: nombre.trim() });
            setCategorias([...categorias, { id: res.id, nombre: nombre.trim(), activo: 1 }]);
            setNombre('');
            setShowForm(false);
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Elimina una categoría solo con confirmación explícita.
    const handleDelete = async id => {
        const accepted = await confirm({
            title: 'Eliminar categoría',
            description: 'La categoría dejará de estar disponible para nuevos registros.',
            confirmLabel: 'Eliminar categoría',
            danger: true
        });
        if (!accepted) return;
        try {
            await api.deleteCategoria(id);
            setCategorias(categorias.filter(categoria => categoria.id !== id));
            notify('La categoría fue eliminada.', { variant: 'success' });
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-700">Categorías del Pueblo</h2>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onReportes}
                        className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:bg-blue-700"
                    >
                        <Icon name="file-text" className="h-4 w-4" />
                        Reportes
                    </button>
                    <button
                        type="button"
                        onClick={onAsistencia}
                        className="flex items-center gap-1 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:bg-orange-700"
                    >
                        <Icon name="clipboard-check" className="h-4 w-4" />
                        Registrar Asistencia
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-1 rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:bg-green-800"
                    >
                        <Icon name="plus" className="h-4 w-4" />
                        Nueva Categoría
                    </button>
                </div>
            </div>

            {showForm && (
                <form
                    onSubmit={handleCreate}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                                Nombre de la categoría
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={event => setNombre(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Ej: Danza, Cafetería, etc."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-green-700 px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-green-800"
                        >
                            Guardar
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-300"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {categorias.length === 0 ? (
                <div className="py-16 text-center">
                    <Icon name="building-2" className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                    <p className="text-lg font-bold text-slate-500">No hay categorías registradas</p>
                    <p className="mt-1 text-sm text-slate-400">
                        Crea categorías para los departamentos del pueblo
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categorias.map(categoria => (
                        <div
                            key={categoria.id}
                            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="flex items-center gap-3">
                                <Icon name="building-2" className="h-5 w-5 text-orange-600" />
                                <span className="font-bold text-slate-800">{categoria.nombre}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDelete(categoria.id)}
                                className="p-1 text-red-400 hover:text-red-600"
                                aria-label={`Eliminar categoría ${categoria.nombre}`}
                            >
                                <Icon name="trash-2" className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Registro de asistencia del Pueblo con cantidad y servicio, sin mezclarlo con reportes.
function VistaAsistenciaPueblo({ categorias, fecha, setFecha, onBack }) {
    const { notify } = window.useFeedback();
    const [categoriaId, setCategoriaId] = React.useState('');
    const [cantidad, setCantidad] = React.useState(1);
    const [servicio, setServicio] = React.useState('Unico');
    const [guardando, setGuardando] = React.useState(false);

    // Persiste un registro y conserva la captura si el servidor devuelve rechazo.
    const handleGuardar = async event => {
        event.preventDefault();
        if (!categoriaId) {
            notify('Selecciona una categoría.', { variant: 'warning' });
            return;
        }
        setGuardando(true);
        try {
            await api.createAsistencia({
                categoria_id: parseInt(categoriaId),
                fecha,
                tipo: 'pueblo',
                cantidad: parseInt(cantidad),
                servicio
            });
            notify('Asistencia registrada correctamente.', { variant: 'success' });
            setCantidad(1);
            setCategoriaId('');
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-slate-600 hover:text-slate-800"
                    aria-label="Volver a categorías"
                >
                    <Icon name="arrow-left" className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-black text-slate-800">Registrar Asistencia del Pueblo</h2>
            </div>

            <form
                onSubmit={handleGuardar}
                className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
                <div className="mb-4">
                    <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                        Categoría / Departamento
                    </label>
                    <select
                        value={categoriaId}
                        onChange={event => setCategoriaId(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                        required
                    >
                        <option value="">Seleccionar...</option>
                        {categorias.map(categoria => (
                            <option key={categoria.id} value={categoria.id}>
                                {categoria.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                        Fecha
                    </label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={event => setFecha(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                        Cantidad de personas
                    </label>
                    <input
                        type="number"
                        value={cantidad}
                        onChange={event => setCantidad(event.target.value)}
                        min="1"
                        max="999"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div className="mb-6">
                    <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                        Servicio
                    </label>
                    <div className="flex gap-2">
                        {['Primer', 'Segundo', 'Tercer', 'Unico'].map(opcion => (
                            <button
                                key={opcion}
                                type="button"
                                onClick={() => setServicio(opcion)}
                                className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
                                    servicio === opcion
                                        ? 'border-orange-600 bg-orange-600 text-white shadow'
                                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {opcion}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={guardando}
                    className="w-full rounded-2xl bg-orange-600 py-3 text-sm font-black text-white shadow-lg transition-all hover:bg-orange-700 disabled:opacity-50"
                >
                    {guardando ? 'Guardando...' : 'Registrar Asistencia'}
                </button>
            </form>
        </div>
    );
}

// Consulta los reportes del Pueblo con filtros explícitos y manejo de error recuperable.
function VistaReportesPueblo({ categorias, onBack }) {
    const { notify } = window.useFeedback();
    const [reportes, setReportes] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [fechaFiltro, setFechaFiltro] = React.useState('');
    const [categoriaFiltro, setCategoriaFiltro] = React.useState('');

    // Ejecuta la búsqueda solo cuando el usuario lo solicita.
    const handleBuscar = async () => {
        setLoading(true);
        const params = {};
        if (fechaFiltro) params.fecha = fechaFiltro;
        if (categoriaFiltro) params.categoria_id = categoriaFiltro;
        try {
            const data = await api.getReportesPueblo(params);
            setReportes(data || []);
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-slate-600 hover:text-slate-800"
                    aria-label="Volver a categorías"
                >
                    <Icon name="arrow-left" className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-black text-slate-800">Reportes del Pueblo</h2>
            </div>

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                            Fecha
                        </label>
                        <input
                            type="date"
                            value={fechaFiltro}
                            onChange={event => setFechaFiltro(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                            Categoría
                        </label>
                        <select
                            value={categoriaFiltro}
                            onChange={event => setCategoriaFiltro(event.target.value)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Todas</option>
                            {categorias.map(categoria => (
                                <option key={categoria.id} value={categoria.id}>
                                    {categoria.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleBuscar}
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-blue-700"
                    >
                        <Icon name="search" className="mr-1 inline h-4 w-4" />
                        Buscar
                    </button>
                </div>
            </div>

            {loading ? (
                <p className="py-12 text-center font-bold text-slate-600 animate-pulse">
                    Cargando reportes...
                </p>
            ) : reportes.length === 0 ? (
                <div className="py-12 text-center">
                    <Icon name="file-text" className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                    <p className="font-bold text-slate-500">No se encontraron registros</p>
                    <p className="mt-1 text-sm text-slate-400">Usa los filtros para buscar asistencias</p>
                </div>
            ) : (
                <div className="ui-table-shell">
                    <table className="ui-table text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                    Fecha
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                    Categoría
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                    Servicio
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                    Cantidad
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportes.map(reporte => (
                                <tr key={reporte.id} className="border-b border-slate-100">
                                    <td data-label="Fecha" className="font-bold text-slate-700">
                                        {reporte.fecha}
                                    </td>
                                    <td data-label="Categoría" className="font-bold text-slate-800">
                                        {reporte.categoria_nombre || '—'}
                                    </td>
                                    <td data-label="Servicio">
                                        <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                                            {reporte.servicio || 'Unico'}
                                        </span>
                                    </td>
                                    <td data-label="Cantidad" className="font-black text-slate-800">
                                        {reporte.cantidad}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
