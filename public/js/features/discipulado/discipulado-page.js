// Módulo funcional de Discipulado separado por capacidad de negocio.
window.Features = window.Features || {};

// Mantiene la carga inicial aislada para que la vista no conozca la obtención de datos.
const useDiscipuladoPage = () => {
    const [grupos, setGrupos] = React.useState([]);
    const [grupoActivo, setGrupoActivo] = React.useState(null);
    const [miembros, setMiembros] = React.useState([]);
    const [asistencias, setAsistencias] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [vista, setVista] = React.useState('grupos');
    const [fecha, setFecha] = React.useState(helpers.today());

    // Carga la lista base de grupos una sola vez al entrar al módulo.
    React.useEffect(() => {
        let active = true;
        api.getGrupos().then(data => {
            if (!active) return;
            setGrupos(data || []);
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
        grupos,
        setGrupos,
        grupoActivo,
        setGrupoActivo,
        miembros,
        setMiembros,
        asistencias,
        setAsistencias,
        loading,
        vista,
        setVista,
        fecha,
        setFecha
    };
};

// Expone el módulo funcional principal como punto de composición.
window.DiscipuladoComponent = function DiscipuladoComponent() {
    const page = useDiscipuladoPage();

    if (page.loading) {
        return (
            <StatusState
                type="loading"
                title="Cargando grupos"
                description="Estamos preparando la información de discipulado."
            />
        );
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-6">
            {page.vista === 'grupos' && (
                <VistaGrupos
                    grupos={page.grupos}
                    setGrupos={page.setGrupos}
                    onSelectGrupo={grupo => {
                        page.setGrupoActivo(grupo);
                        page.setVista('miembros');
                    }}
                />
            )}
            {page.vista === 'miembros' && page.grupoActivo && (
                <VistaMiembros
                    grupo={page.grupoActivo}
                    miembros={page.miembros}
                    setMiembros={page.setMiembros}
                    onBack={() => page.setVista('grupos')}
                    onAsistencia={() => page.setVista('asistencia')}
                    onHistorial={() => page.setVista('historial')}
                />
            )}
            {page.vista === 'asistencia' && page.grupoActivo && (
                <VistaAsistencia
                    grupo={page.grupoActivo}
                    miembros={page.miembros}
                    setMiembros={page.setMiembros}
                    fecha={page.fecha}
                    setFecha={page.setFecha}
                    asistencias={page.asistencias}
                    setAsistencias={page.setAsistencias}
                    onBack={() => page.setVista('miembros')}
                />
            )}
            {page.vista === 'historial' && page.grupoActivo && (
                <VistaHistorial
                    grupo={page.grupoActivo}
                    onBack={() => page.setVista('miembros')}
                />
            )}
        </main>
    );
};

// Listado de grupos con creación, eliminación y acceso al detalle.
function VistaGrupos({ grupos, setGrupos, onSelectGrupo }) {
    const { notify, confirm } = window.useFeedback();
    const [showForm, setShowForm] = React.useState(false);
    const [nombre, setNombre] = React.useState('');
    const [lugar, setLugar] = React.useState('');

    // Crea un nuevo grupo de discipulado sin abandonar el formulario ante un error.
    const handleCreate = async event => {
        event.preventDefault();
        if (!nombre.trim()) return;
        try {
            const res = await api.createGrupo({
                nombre: nombre.trim(),
                lugar: lugar.trim() || null
            });
            setGrupos([...grupos, {
                id: res.id,
                nombre: nombre.trim(),
                lugar: lugar.trim() || null,
                miembros_count: 0
            }]);
            setNombre('');
            setLugar('');
            setShowForm(false);
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Elimina un grupo solo después de confirmar la intención del usuario.
    const handleDelete = async id => {
        const accepted = await confirm({
            title: 'Eliminar grupo',
            description: 'El grupo se retirará, pero sus integrantes no se perderán.',
            confirmLabel: 'Eliminar grupo',
            danger: true
        });
        if (!accepted) return;
        try {
            await api.deleteGrupo(id);
            setGrupos(grupos.filter(grupo => grupo.id !== id));
            notify('El grupo fue eliminado.', { variant: 'success' });
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-700">Grupos de Discipulado</h2>
                <button
                    type="button"
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:bg-purple-800"
                >
                    <Icon name="plus" className="h-4 w-4" />
                    Nuevo Grupo
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={handleCreate}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={event => setNombre(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Ej: Discipulado 1"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                                Lugar
                            </label>
                            <input
                                type="text"
                                value={lugar}
                                onChange={event => setLugar(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Ej: Salón principal"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="rounded-xl bg-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-purple-800"
                        >
                            Guardar Grupo
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

            {grupos.length === 0 ? (
                <div className="py-16 text-center">
                    <Icon name="book-open" className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                    <p className="text-lg font-bold text-slate-500">No hay grupos de discipulado</p>
                    <p className="mt-1 text-sm text-slate-400">Crea tu primer grupo para comenzar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {grupos.map(grupo => (
                        <div
                            key={grupo.id}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">{grupo.nombre}</h3>
                                    {grupo.lugar && (
                                        <p className="mt-1 text-sm font-bold text-slate-500">
                                            <Icon name="map-pin" className="mr-1 inline h-3 w-3" />
                                            {grupo.lugar}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(grupo.id)}
                                    className="p-1 text-red-400 hover:text-red-600"
                                >
                                    <Icon name="trash-2" className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-3xl font-black text-purple-700">
                                    {grupo.miembros_count || 0}
                                </span>
                                <span className="text-xs font-bold uppercase text-slate-500">
                                    integrantes
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectGrupo(grupo)}
                                className="mt-4 w-full rounded-xl bg-purple-50 py-2.5 text-sm font-bold text-purple-700 transition-all hover:bg-purple-100"
                            >
                                <Icon name="arrow-right" className="mr-1 inline h-4 w-4" />
                                Gestionar Grupo
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Lista de integrantes con acciones para crear, borrar y cambiar de vista.
function VistaMiembros({ grupo, miembros, setMiembros, onBack, onAsistencia, onHistorial }) {
    const { notify, confirm } = window.useFeedback();
    const [showForm, setShowForm] = React.useState(false);
    const [nombre, setNombre] = React.useState('');

    // Carga los miembros del grupo actual sin bloquear la navegación hacia atrás.
    React.useEffect(() => {
        let active = true;
        api.getMiembros({ grupo_id: grupo.id, tipo: 'discipulado' }).then(data => {
            if (!active) return;
            setMiembros(data || []);
        });
        return () => {
            active = false;
        };
    }, [grupo.id, setMiembros]);

    // Agrega un integrante nuevo y mantiene la edición local si el servidor responde con error.
    const handleAdd = async event => {
        event.preventDefault();
        if (!nombre.trim()) return;
        try {
            const res = await api.createMiembro({
                nombre: nombre.trim(),
                tipo: 'discipulado',
                grupo_id: grupo.id
            });
            setMiembros([...miembros, {
                id: res.id,
                nombre: nombre.trim(),
                tipo: 'discipulado',
                grupo_id: grupo.id,
                activo: 1
            }]);
            setNombre('');
            setShowForm(false);
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Elimina un integrante con confirmación explícita para evitar borrados accidentales.
    const handleRemove = async id => {
        const accepted = await confirm({
            title: 'Eliminar integrante',
            description: 'El integrante se retirará del grupo seleccionado.',
            confirmLabel: 'Eliminar integrante',
            danger: true
        });
        if (!accepted) return;
        try {
            await api.deleteMiembro(id);
            setMiembros(miembros.filter(miembro => miembro.id !== id));
            notify('El integrante fue eliminado.', { variant: 'success' });
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onBack} className="text-slate-600 hover:text-slate-800">
                        <Icon name="arrow-left" className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-800">{grupo.nombre}</h2>
                        {grupo.lugar && <p className="text-xs font-bold text-slate-500">{grupo.lugar}</p>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onHistorial}
                        className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-300"
                    >
                        <Icon name="history" className="mr-1 inline h-4 w-4" />
                        Historial
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:bg-purple-800"
                    >
                        <Icon name="user-plus" className="mr-1 inline h-4 w-4" />
                        Agregar
                    </button>
                </div>
            </div>

            {showForm && (
                <form
                    onSubmit={handleAdd}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                                Nombre del integrante
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={event => setNombre(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Nombre completo"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-purple-700 px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-purple-800"
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

            <button
                type="button"
                onClick={onAsistencia}
                className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 py-4 text-lg font-black text-white shadow-lg transition-all hover:opacity-90"
            >
                <Icon name="clipboard-check" className="h-6 w-6" />
                Registrar Asistencia - {new Date().toLocaleDateString('es-MX')}
            </button>

            {miembros.length === 0 ? (
                <div className="py-12 text-center">
                    <Icon name="users" className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                    <p className="font-bold text-slate-500">Este grupo no tiene integrantes</p>
                    <p className="mt-1 text-sm text-slate-400">Agrega integrantes para registrar asistencia</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {miembros.map((miembro, index) => (
                        <div
                            key={miembro.id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-6 text-sm font-bold text-slate-400">{index + 1}.</span>
                                <span className="font-bold text-slate-800">{miembro.nombre}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemove(miembro.id)}
                                className="p-1 text-red-400 hover:text-red-600"
                            >
                                <Icon name="x" className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Registro transaccional de asistencia diaria para el grupo activo.
function VistaAsistencia({
    grupo,
    miembros,
    fecha,
    setFecha,
    asistencias,
    setAsistencias,
    onBack
}) {
    const { notify } = window.useFeedback();
    const [estados, setEstados] = React.useState({});

    // Recupera la asistencia existente y prepara un mapa local por miembro.
    React.useEffect(() => {
        let active = true;
        api.getAsistencias({ fecha, tipo: 'discipulado' }).then(data => {
            if (!active) return;
            setAsistencias(data || []);
            const initial = {};
            miembros.forEach(miembro => {
                const existente = (data || []).find(asistencia => asistencia.miembro_id === miembro.id);
                initial[miembro.id] = existente ? existente.estado : 'ausente';
            });
            setEstados(initial);
        });
        return () => {
            active = false;
        };
    }, [fecha, grupo.id, miembros, setAsistencias]);

    // Cambia el estado local de un miembro sin mutar la estructura anterior.
    const toggleEstado = (miembroId, estado) => {
        setEstados(prev => ({ ...prev, [miembroId]: estado }));
    };

    // Persiste la lista completa en una sola operación para evitar estados parciales.
    const handleGuardar = async () => {
        try {
            await api.saveAsistenciaGrupo(grupo.id, {
                fecha,
                asistencias: miembros.map(miembro => ({
                    miembro_id: miembro.id,
                    estado: estados[miembro.id] || 'ausente'
                }))
            });
            notify('Asistencia guardada correctamente.', { variant: 'success' });
            onBack();
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Traduce estados a iconos y colores para evitar duplicar reglas visuales.
    const iconoEstado = estado => {
        switch (estado) {
            case 'presente':
                return 'check-circle';
            case 'reportado':
                return 'clock';
            case 'ausente':
                return 'x-circle';
            default:
                return 'help-circle';
        }
    };

    const colorEstado = estado => {
        switch (estado) {
            case 'presente':
                return 'bg-green-100 text-green-700 border-green-300';
            case 'reportado':
                return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'ausente':
                return 'bg-red-100 text-red-700 border-red-300';
            default:
                return 'bg-slate-100 text-slate-500 border-slate-300';
        }
    };

    const conteo = { presente: 0, reportado: 0, ausente: 0 };
    Object.values(estados).forEach(estado => {
        conteo[estado] = (conteo[estado] || 0) + 1;
    });

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onBack} className="text-slate-600 hover:text-slate-800">
                        <Icon name="arrow-left" className="h-5 w-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Asistencia - {grupo.nombre}</h2>
                        <p className="text-xs font-bold text-slate-500">{miembros.length} integrantes</p>
                    </div>
                </div>
                <input
                    type="date"
                    value={fecha}
                    onChange={event => setFecha(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="mb-6 flex gap-3">
                <span className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                    <Icon name="check-circle" className="h-3 w-3" />
                    {conteo.presente} Presentes
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-yellow-100 px-3 py-1.5 text-xs font-bold text-yellow-700">
                    <Icon name="clock" className="h-3 w-3" />
                    {conteo.reportado} Reportados
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
                    <Icon name="x-circle" className="h-3 w-3" />
                    {conteo.ausente} Ausentes
                </span>
            </div>

            <div className="mb-6 space-y-2">
                {miembros.map((miembro, index) => (
                    <div
                        key={miembro.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-6 text-sm font-bold text-slate-400">{index + 1}.</span>
                            <span className="font-bold text-slate-800">{miembro.nombre}</span>
                        </div>
                        <div className="flex gap-1.5">
                            {['presente', 'reportado', 'ausente'].map(estado => (
                                <button
                                    key={estado}
                                    type="button"
                                    onClick={() => toggleEstado(miembro.id, estado)}
                                    className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                                        estados[miembro.id] === estado
                                            ? `${colorEstado(estado)} shadow-sm`
                                            : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon name={iconoEstado(estado)} className="h-3 w-3" />
                                    {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={handleGuardar}
                className="w-full rounded-2xl bg-purple-700 py-4 text-lg font-black text-white shadow-lg transition-all hover:bg-purple-800"
            >
                <Icon name="save" className="mr-2 inline h-5 w-5" />
                Guardar Asistencia
            </button>
        </div>
    );
}

// Muestra el historial filtrable de un grupo sin acoplar la vista a la carga inicial.
function VistaHistorial({ grupo, onBack }) {
    const [historial, setHistorial] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [fechaFiltro, setFechaFiltro] = React.useState('');

    // Consulta el historial cada vez que cambia el filtro o el grupo activo.
    React.useEffect(() => {
        let active = true;
        setLoading(true);
        const params = { tipo: 'discipulado' };
        if (fechaFiltro) params.fecha = fechaFiltro;
        api.getAsistencias(params).then(data => {
            if (!active) return;
            setHistorial(data || []);
            setLoading(false);
        }).catch(() => {
            if (!active) return;
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [grupo.id, fechaFiltro]);

    if (loading) {
        return (
            <p className="py-12 text-center font-bold text-slate-600 animate-pulse">
                Cargando historial...
            </p>
        );
    }

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <button type="button" onClick={onBack} className="text-slate-600 hover:text-slate-800">
                        <Icon name="arrow-left" className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-black text-slate-800">Historial - {grupo.nombre}</h2>
                </div>
                <input
                    type="date"
                    value={fechaFiltro}
                    onChange={event => setFechaFiltro(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {historial.length === 0 ? (
                <div className="py-12 text-center">
                    <Icon name="calendar" className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                    <p className="font-bold text-slate-500">No hay asistencias registradas</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                    Fecha
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                    Miembro
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map(asistencia => (
                                <tr key={asistencia.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3 font-bold text-slate-700">{asistencia.fecha}</td>
                                    <td className="px-4 py-3 font-bold text-slate-800">
                                        {asistencia.miembro_id}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-lg px-2 py-1 text-xs font-bold ${
                                            asistencia.estado === 'presente'
                                                ? 'bg-green-100 text-green-700'
                                                : asistencia.estado === 'reportado'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                        }`}>
                                            {asistencia.estado?.toUpperCase()}
                                        </span>
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
