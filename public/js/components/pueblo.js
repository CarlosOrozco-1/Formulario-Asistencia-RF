// Componente Pueblo - Gestion autenticada de categorias, asistencia y reportes
// El formulario público utiliza un endpoint independiente y no depende de este componente
const { useState, useEffect } = React;
const { api, helpers } = window;
const { Icon, StatusState } = window.UI;

window.PuebloComponent = function PuebloComponent() {
    // Estados del componente: vista activa, categorias, asistencias, fecha
    const [vista, setVista] = useState('categorias'); // categorias | asistencia | reportes
    const [categorias, setCategorias] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fecha, setFecha] = useState(helpers.today()); // Evita registrar el día UTC incorrecto

    // Carga las categorias al montar el componente
    useEffect(() => {
        api.getCategorias().then(data => {
            setCategorias(data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Mientras carga
    if (loading) {
        return (
            <StatusState
                type="loading"
                title="Cargando categorías"
                description="Estamos preparando la información de Pueblo."
            />
        );
    }

    // Renderizado principal segun la vista activa
    return (
        <main className="max-w-6xl mx-auto px-4 py-6">
                {vista === 'categorias' && (
                    <VistaCategorias
                        categorias={categorias}
                        setCategorias={setCategorias}
                        onAsistencia={() => setVista('asistencia')}
                        onReportes={() => setVista('reportes')}
                    />
                )}
                {vista === 'asistencia' && (
                    <VistaAsistenciaPueblo
                        categorias={categorias}
                        fecha={fecha}
                        setFecha={setFecha}
                        onBack={() => setVista('categorias')}
                    />
                )}
                {vista === 'reportes' && (
                    <VistaReportesPueblo
                        categorias={categorias}
                        onBack={() => setVista('categorias')}
                    />
                )}
        </main>
    );
};

// ---------------------------------------------------------------------------
// VistaCategorias: Listado de categorias/departamentos del pueblo
// ---------------------------------------------------------------------------
function VistaCategorias({ categorias, setCategorias, onAsistencia, onReportes }) {
    const { notify, confirm } = window.useFeedback();
    const [showForm, setShowForm] = useState(false);
    const [nombre, setNombre] = useState('');

    // Crea una nueva categoria
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        try {
            const res = await api.createCategoria({ nombre: nombre.trim() });
            setCategorias([...categorias, { id: res.id, nombre: nombre.trim(), activo: 1 }]);
            setNombre('');
            setShowForm(false);
        } catch (error) {
            // Conserva el formulario para corregir validación o un nombre duplicado.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Elimina una categoria
    const handleDelete = async (id) => {
        const accepted = await confirm({
            title: 'Eliminar categoría',
            description: 'La categoría dejará de estar disponible para nuevos registros.',
            confirmLabel: 'Eliminar categoría',
            danger: true
        });
        if (!accepted) return;
        try {
            await api.deleteCategoria(id);
            setCategorias(categorias.filter(c => c.id !== id));
            notify('La categoría fue eliminada.', { variant: 'success' });
        } catch (error) {
            // Evita ocultar la categoría cuando el servidor no confirmó la operación.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    return (
        <div>
            {/* Encabezado con acciones */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-lg font-black text-slate-700">Categorias del Pueblo</h2>
                <div className="flex gap-2">
                    <button onClick={onReportes}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow flex items-center gap-1">
                        <Icon name="file-text" className="w-4 h-4" />
                        Reportes
                    </button>
                    <button onClick={onAsistencia}
                        className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-orange-700 transition-all shadow flex items-center gap-1">
                        <Icon name="clipboard-check" className="w-4 h-4" />
                        Registrar Asistencia
                    </button>
                    <button onClick={() => setShowForm(!showForm)}
                        className="bg-green-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-800 transition-all shadow flex items-center gap-1">
                        <Icon name="plus" className="w-4 h-4" />
                        Nueva Categoria
                    </button>
                </div>
            </div>

            {/* Formulario para crear categoria */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-black text-slate-600 uppercase mb-1">Nombre de la categoria</label>
                            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none font-bold text-sm"
                                placeholder="Ej: Danza, Cafeteria, etc." required />
                        </div>
                        <button type="submit"
                            className="bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-800 transition-all shadow">
                            Guardar
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-300 transition-all">
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Grilla de categorias */}
            {categorias.length === 0 ? (
                <div className="text-center py-16">
                    <Icon
                        name="building-2"
                        className="w-16 h-16 text-slate-300 mx-auto mb-4"
                    />
                    <p className="text-slate-500 font-bold text-lg">No hay categorias registradas</p>
                    <p className="text-slate-400 text-sm mt-1">Crea categorias para los departamentos del pueblo</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorias.map(cat => (
                        <div key={cat.id}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <Icon
                                    name="building-2"
                                    className="w-5 h-5 text-orange-600"
                                />
                                <span className="font-bold text-slate-800">{cat.nombre}</span>
                            </div>
                            <button onClick={() => handleDelete(cat.id)}
                                className="text-red-400 hover:text-red-600 p-1">
                                <Icon name="trash-2" className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// VistaAsistenciaPueblo: Registro de asistencia para el pueblo
// Permite seleccionar categoria, cantidad de personas y servicio
// ---------------------------------------------------------------------------
function VistaAsistenciaPueblo({ categorias, fecha, setFecha, onBack }) {
    const { notify } = window.useFeedback();
    const [categoriaId, setCategoriaId] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [servicio, setServicio] = useState('Unico');
    const [guardando, setGuardando] = useState(false);

    // Guarda el registro de asistencia
    const handleGuardar = async (e) => {
        e.preventDefault();
        if (!categoriaId) {
            notify('Selecciona una categoría.', { variant: 'warning' });
            return;
        }
        setGuardando(true);
        try {
            await api.createAsistencia({
                categoria_id: parseInt(categoriaId),
                fecha: fecha,
                tipo: 'pueblo',
                cantidad: parseInt(cantidad),
                servicio: servicio
            });
            notify('Asistencia registrada correctamente.', { variant: 'success' });
            setCantidad(1);
            setCategoriaId('');
        } catch (error) {
            // Muestra el motivo del rechazo y mantiene los valores capturados para corregirlos.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="text-slate-600 hover:text-slate-800">
                    <Icon name="arrow-left" className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-black text-slate-800">Registrar Asistencia del Pueblo</h2>
            </div>

            <form onSubmit={handleGuardar} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-lg">
                {/* Selector de categoria */}
                <div className="mb-4">
                    <label className="block text-xs font-black text-slate-600 uppercase mb-1">Categoria / Departamento</label>
                    <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm"
                        required>
                        <option value="">Seleccionar...</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Fecha */}
                <div className="mb-4">
                    <label className="block text-xs font-black text-slate-600 uppercase mb-1">Fecha</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm" />
                </div>

                {/* Cantidad de personas */}
                <div className="mb-4">
                    <label className="block text-xs font-black text-slate-600 uppercase mb-1">Cantidad de personas</label>
                    <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                        min="1" max="999"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none font-bold text-sm" />
                </div>

                {/* Tipo de servicio */}
                <div className="mb-6">
                    <label className="block text-xs font-black text-slate-600 uppercase mb-1">Servicio</label>
                    <div className="flex gap-2">
                        {['Primer', 'Segundo', 'Tercer', 'Unico'].map(s => (
                            <button key={s} type="button" onClick={() => setServicio(s)}
                                className={`px-4 py-2 rounded-xl font-bold text-xs border transition-all ${
                                    servicio === s
                                        ? 'bg-orange-600 text-white border-orange-600 shadow'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Boton de guardar */}
                <button type="submit" disabled={guardando}
                    className="w-full bg-orange-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-orange-700 transition-all disabled:opacity-50 shadow-lg">
                    {guardando ? 'Guardando...' : 'Registrar Asistencia'}
                </button>
            </form>
        </div>
    );
}

// ---------------------------------------------------------------------------
// VistaReportesPueblo: Consulta de asistencias registradas del pueblo
// Permite filtrar por fecha y categoria, y exportar a PDF
// ---------------------------------------------------------------------------
function VistaReportesPueblo({ categorias, onBack }) {
    const { notify } = window.useFeedback();
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fechaFiltro, setFechaFiltro] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');

    // Carga los reportes segun los filtros seleccionados
    const handleBuscar = async () => {
        setLoading(true);
        const params = {};
        if (fechaFiltro) params.fecha = fechaFiltro;
        if (categoriaFiltro) params.categoria_id = categoriaFiltro;
        try {
            const data = await api.getReportesPueblo(params);
            setReportes(data || []);
        } catch (error) {
            // Diferencia filtros inválidos y desconexión sin dejar la vista cargando.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={onBack} className="text-slate-600 hover:text-slate-800">
                    <Icon name="arrow-left" className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-black text-slate-800">Reportes del Pueblo</h2>
            </div>

            {/* Filtros de busqueda */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                <div className="flex gap-3 flex-wrap items-end">
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase mb-1">Fecha</label>
                        <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase mb-1">Categoria</label>
                        <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                            <option value="">Todas</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleBuscar}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow">
                        <Icon name="search" className="w-4 h-4 inline mr-1" />
                        Buscar
                    </button>
                </div>
            </div>

            {/* Tabla de resultados */}
            {loading ? (
                <p className="text-center text-slate-600 font-bold py-12 animate-pulse">Cargando reportes...</p>
            ) : reportes.length === 0 ? (
                <div className="text-center py-12">
                    <Icon
                        name="file-text"
                        className="w-16 h-16 text-slate-300 mx-auto mb-4"
                    />
                    <p className="text-slate-500 font-bold">No se encontraron registros</p>
                    <p className="text-slate-400 text-sm mt-1">Usa los filtros para buscar asistencias</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Fecha</th>
                                <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Categoria</th>
                                <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Servicio</th>
                                <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportes.map(r => (
                                <tr key={r.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3 font-bold text-slate-700">{r.fecha}</td>
                                    <td className="px-4 py-3 font-bold text-slate-800">{r.categoria_nombre || '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold text-xs">
                                            {r.servicio || 'Unico'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-black text-slate-800">{r.cantidad}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
