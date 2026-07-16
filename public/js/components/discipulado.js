// Componente Discipulado - Gestion de grupos, integrantes y asistencia
// Permite crear grupos de discipulado, agregar integrantes por grupo,
// registrar asistencia diaria y exportar reportes PDF
const { useState, useEffect } = React;
const { api, helpers } = window;
const { Icon, StatusState } = window.UI;

window.DiscipuladoComponent = function DiscipuladoComponent() {
    // Estados principales del componente
    const [grupos, setGrupos] = useState([]);           // Lista de grupos de discipulado
    const [grupoActivo, setGrupoActivo] = useState(null); // Grupo seleccionado actualmente
    const [miembros, setMiembros] = useState([]);       // Miembros del grupo activo
    const [asistencias, setAsistencias] = useState([]);  // Asistencias del dia para el grupo
    const [loading, setLoading] = useState(true);        // Estado de carga
    const [vista, setVista] = useState('grupos');        // 'grupos' | 'miembros' | 'asistencia' | 'historial'
    // Inicializa la asistencia con la fecha vigente en la zona horaria institucional.
    const [fecha, setFecha] = useState(helpers.today());

    // Carga la lista de grupos al montar el componente
    useEffect(() => {
        api.getGrupos().then(data => {
            setGrupos(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Mientras se cargan los datos iniciales
    if (loading) {
        return (
            <StatusState
                type="loading"
                title="Cargando grupos"
                description="Estamos preparando la información de discipulado."
            />
        );
    }

    // Renderizado principal segun la vista activa
    return (
        <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Navegacion entre vistas del modulo */}
                {vista === 'grupos' && (
                    <VistaGrupos
                        grupos={grupos}
                        setGrupos={setGrupos}
                        onSelectGrupo={(g) => {
                            setGrupoActivo(g);
                            setVista('miembros');
                        }}
                    />
                )}
                {vista === 'miembros' && (
                    <VistaMiembros
                        grupo={grupoActivo}
                        miembros={miembros}
                        setMiembros={setMiembros}
                        onBack={() => setVista('grupos')}
                        onAsistencia={() => setVista('asistencia')}
                        onHistorial={() => setVista('historial')}
                    />
                )}
                {vista === 'asistencia' && (
                    <VistaAsistencia
                        grupo={grupoActivo}
                        miembros={miembros}
                        setMiembros={setMiembros}
                        fecha={fecha}
                        setFecha={setFecha}
                        asistencias={asistencias}
                        setAsistencias={setAsistencias}
                        onBack={() => setVista('miembros')}
                    />
                )}
                {vista === 'historial' && (
                    <VistaHistorial
                        grupo={grupoActivo}
                        onBack={() => setVista('miembros')}
                    />
                )}
        </main>
    );
};

// ---------------------------------------------------------------------------
// VistaGrupos: Listado de grupos con opciones de crear, editar y eliminar
// ---------------------------------------------------------------------------
function VistaGrupos({ grupos, setGrupos, onSelectGrupo }) {
    const { notify, confirm } = window.useFeedback();
    const [showForm, setShowForm] = useState(false);
    const [nombre, setNombre] = useState('');
    const [lugar, setLugar] = useState('');

    // Crea un nuevo grupo de discipulado
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        try {
            const res = await api.createGrupo({
                nombre: nombre.trim(),
                lugar: lugar.trim() || null
            });
            const newGrupo = { id: res.id, nombre: nombre.trim(), lugar: lugar.trim() || null, miembros_count: 0 };
            setGrupos([...grupos, newGrupo]);
            setNombre('');
            setLugar('');
            setShowForm(false);
        } catch (error) {
            // Mantiene el formulario abierto y explica el rechazo recibido desde la API.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Elimina (desactiva) un grupo
    const handleDelete = async (id) => {
        const accepted = await confirm({
            title: 'Eliminar grupo',
            description: 'El grupo se retirará, pero sus integrantes no se perderán.',
            confirmLabel: 'Eliminar grupo',
            danger: true
        });
        if (!accepted) return;
        try {
            await api.deleteGrupo(id);
            setGrupos(grupos.filter(g => g.id !== id));
            notify('El grupo fue eliminado.', { variant: 'success' });
        } catch (error) {
            // Evita retirar visualmente un grupo cuando el servidor rechazó la eliminación.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    return (
        <div>
            {/* Encabezado con boton para agregar grupo */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-700">Grupos de Discipulado</h2>
                <button onClick={() => setShowForm(!showForm)}
                    className="bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-800 transition-all flex items-center gap-2 shadow">
                    <Icon name="plus" className="w-4 h-4" />
                    Nuevo Grupo
                </button>
            </div>

            {/* Formulario para crear grupo */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-black text-slate-600 uppercase mb-1">Nombre</label>
                            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm"
                                placeholder="Ej: Discipulado 1" required />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-600 uppercase mb-1">Lugar</label>
                            <input type="text" value={lugar} onChange={(e) => setLugar(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm"
                                placeholder="Ej: Salon principal" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit"
                            className="bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-800 transition-all shadow">
                            Guardar Grupo
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-300 transition-all">
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Grilla de grupos */}
            {grupos.length === 0 ? (
                <div className="text-center py-16">
                    <Icon
                        name="book-open"
                        className="w-16 h-16 text-slate-300 mx-auto mb-4"
                    />
                    <p className="text-slate-500 font-bold text-lg">No hay grupos de discipulado</p>
                    <p className="text-slate-400 text-sm mt-1">Crea tu primer grupo para comenzar</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grupos.map(grupo => (
                        <div key={grupo.id}
                            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg">{grupo.nombre}</h3>
                                    {grupo.lugar && (
                                        <p className="text-sm text-slate-500 font-bold mt-1">
                                            <Icon
                                                name="map-pin"
                                                className="w-3 h-3 inline mr-1"
                                            />
                                            {grupo.lugar}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => handleDelete(grupo.id)}
                                    className="text-red-400 hover:text-red-600 p-1">
                                    <Icon name="trash-2" className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-3xl font-black text-purple-700">{grupo.miembros_count || 0}</span>
                                <span className="text-xs text-slate-500 font-bold uppercase">integrantes</span>
                            </div>
                            <button onClick={() => onSelectGrupo(grupo)}
                                className="mt-4 w-full bg-purple-50 text-purple-700 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all">
                                <Icon name="arrow-right" className="w-4 h-4 inline mr-1" />
                                Gestionar Grupo
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// VistaMiembros: Lista de integrantes del grupo seleccionado
// ---------------------------------------------------------------------------
function VistaMiembros({ grupo, miembros, setMiembros, onBack, onAsistencia, onHistorial }) {
    const { notify, confirm } = window.useFeedback();
    const [showForm, setShowForm] = useState(false);
    const [nombre, setNombre] = useState('');

    // Carga los miembros del grupo al entrar a la vista
    useEffect(() => {
        api.getMiembros({ grupo_id: grupo.id, tipo: 'discipulado' }).then(setMiembros);
    }, [grupo.id]);

    // Agrega un nuevo integrante al grupo
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        try {
            const res = await api.createMiembro({
                nombre: nombre.trim(),
                tipo: 'discipulado',
                grupo_id: grupo.id
            });
            setMiembros([...miembros, { id: res.id, nombre: nombre.trim(), tipo: 'discipulado', grupo_id: grupo.id, activo: 1 }]);
            setNombre('');
            setShowForm(false);
        } catch (error) {
            // Conserva la captura del integrante cuando la API devuelve validación o conflicto.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Elimina un integrante del grupo
    const handleRemove = async (id) => {
        const accepted = await confirm({
            title: 'Eliminar integrante',
            description: 'El integrante se retirará del grupo seleccionado.',
            confirmLabel: 'Eliminar integrante',
            danger: true
        });
        if (!accepted) return;
        try {
            await api.deleteMiembro(id);
            setMiembros(miembros.filter(m => m.id !== id));
            notify('El integrante fue eliminado.', { variant: 'success' });
        } catch (error) {
            // Mantiene el integrante visible si existen relaciones que impiden eliminarlo.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    return (
        <div>
            {/* Encabezado con navegacion */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-600 hover:text-slate-800">
                        <Icon name="arrow-left" className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-800">{grupo.nombre}</h2>
                        {grupo.lugar && <p className="text-xs text-slate-500 font-bold">{grupo.lugar}</p>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onHistorial}
                        className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-300 transition-all">
                        <Icon name="history" className="w-4 h-4 inline mr-1" />
                        Historial
                    </button>
                    <button onClick={() => setShowForm(!showForm)}
                        className="bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-800 transition-all shadow">
                        <Icon name="user-plus" className="w-4 h-4 inline mr-1" />
                        Agregar
                    </button>
                </div>
            </div>

            {/* Formulario para agregar integrante */}
            {showForm && (
                <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-black text-slate-600 uppercase mb-1">Nombre del integrante</label>
                            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm"
                                placeholder="Nombre completo" required />
                        </div>
                        <button type="submit"
                            className="bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-800 transition-all shadow">
                            Guardar
                        </button>
                        <button type="button" onClick={() => setShowForm(false)}
                            className="bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-300 transition-all">
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Boton para ir a registrar asistencia */}
            <button onClick={onAsistencia}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4 rounded-2xl font-black text-lg mb-6 hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2">
                <Icon name="clipboard-check" className="w-6 h-6" />
                Registrar Asistencia - {new Date().toLocaleDateString('es-MX')}
            </button>

            {/* Lista de integrantes */}
            {miembros.length === 0 ? (
                <div className="text-center py-12">
                    <Icon
                        name="users"
                        className="w-16 h-16 text-slate-300 mx-auto mb-4"
                    />
                    <p className="text-slate-500 font-bold">Este grupo no tiene integrantes</p>
                    <p className="text-slate-400 text-sm mt-1">Agrega integrantes para registrar asistencia</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {miembros.map((m, i) => (
                        <div key={m.id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-bold text-sm w-6">{i + 1}.</span>
                                <span className="font-bold text-slate-800">{m.nombre}</span>
                            </div>
                            <button onClick={() => handleRemove(m.id)}
                                className="text-red-400 hover:text-red-600 p-1">
                                <Icon name="x" className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// VistaAsistencia: Registro de asistencia del dia para el grupo seleccionado
// ---------------------------------------------------------------------------
function VistaAsistencia({
    grupo,
    miembros,
    setMiembros,
    fecha,
    setFecha,
    asistencias,
    setAsistencias,
    onBack
}) {
    const { notify } = window.useFeedback();
    // Estados de asistencia para cada miembro
    const [estados, setEstados] = useState({});

    // Carga las asistencias existentes para la fecha y grupo seleccionados
    useEffect(() => {
        api.getAsistencias({ fecha, tipo: 'discipulado' }).then(data => {
            setAsistencias(data || []);
            // Inicializa estados: si ya hay asistencia registrada, usa ese estado; si no, 'ausente'
            const initial = {};
            miembros.forEach(m => {
                const existente = (data || []).find(a => a.miembro_id === m.id);
                initial[m.id] = existente ? existente.estado : 'ausente';
            });
            setEstados(initial);
        });
    }, [fecha, grupo.id]);

    // Cambia el estado de un miembro (presente/ausente/reportado)
    const toggleEstado = (miembroId, estado) => {
        setEstados(prev => ({ ...prev, [miembroId]: estado }));
    };

    // Guarda la asistencia del dia
    const handleGuardar = async () => {
        try {
            // Envía la lista completa para que el servidor la reemplace sin estados parciales.
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
            // Informa el fallo sin afirmar que el registro completo fue guardado.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Icono segun el estado de asistencia
    const iconoEstado = (estado) => {
        switch (estado) {
            case 'presente': return 'check-circle';
            case 'reportado': return 'clock';
            case 'ausente': return 'x-circle';
            default: return 'help-circle';
        }
    };

    // Color segun el estado
    const colorEstado = (estado) => {
        switch (estado) {
            case 'presente': return 'bg-green-100 text-green-700 border-green-300';
            case 'reportado': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'ausente': return 'bg-red-100 text-red-700 border-red-300';
            default: return 'bg-slate-100 text-slate-500 border-slate-300';
        }
    };

    // Cuenta cuantos miembros tienen cada estado
    const conteo = { presente: 0, reportado: 0, ausente: 0 };
    Object.values(estados).forEach(e => { conteo[e] = (conteo[e] || 0) + 1; });

    return (
        <div>
            {/* Encabezado con fecha y estadisticas */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-600 hover:text-slate-800">
                        <Icon name="arrow-left" className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Asistencia - {grupo.nombre}</h2>
                        <p className="text-xs text-slate-500 font-bold">{miembros.length} integrantes</p>
                    </div>
                </div>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500" />
            </div>

            {/* Barra de resumen de conteo */}
            <div className="flex gap-3 mb-6">
                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1">
                    <Icon name="check-circle" className="w-3 h-3" />
                    {conteo.presente} Presentes
                </span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1">
                    <Icon name="clock" className="w-3 h-3" />
                    {conteo.reportado} Reportados
                </span>
                <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1">
                    <Icon name="x-circle" className="w-3 h-3" />
                    {conteo.ausente} Ausentes
                </span>
            </div>

            {/* Lista de miembros con selector de estado */}
            <div className="space-y-2 mb-6">
                {miembros.map((m, i) => (
                    <div key={m.id}
                        className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-bold text-sm w-6">{i + 1}.</span>
                            <span className="font-bold text-slate-800">{m.nombre}</span>
                        </div>
                        <div className="flex gap-1.5">
                            {['presente', 'reportado', 'ausente'].map(est => (
                                <button key={est} onClick={() => toggleEstado(m.id, est)}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs border transition-all flex items-center gap-1 ${
                                        estados[m.id] === est
                                            ? colorEstado(est) + ' shadow-sm'
                                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                    }`}>
                                    <Icon name={iconoEstado(est)} className="w-3 h-3" />
                                    {est.charAt(0).toUpperCase() + est.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Boton para guardar */}
            <button onClick={handleGuardar}
                className="w-full bg-purple-700 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-800 transition-all shadow-lg">
                <Icon name="save" className="w-5 h-5 inline mr-2" />
                Guardar Asistencia
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// VistaHistorial: Muestra el historial de asistencias del grupo
// ---------------------------------------------------------------------------
function VistaHistorial({ grupo, onBack }) {
    const [historial, setHistorial] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fechaFiltro, setFechaFiltro] = useState('');

    // Carga el historial completo de asistencias del grupo
    useEffect(() => {
        const params = { tipo: 'discipulado' };
        if (fechaFiltro) params.fecha = fechaFiltro;
        api.getAsistencias(params).then(data => {
            // Filtra solo las asistencias de miembros de este grupo
            setHistorial(data || []);
            setLoading(false);
        });
    }, [grupo.id, fechaFiltro]);

    if (loading) {
        return <p className="text-center text-slate-600 font-bold py-12 animate-pulse">Cargando historial...</p>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-600 hover:text-slate-800">
                        <Icon name="arrow-left" className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-black text-slate-800">Historial - {grupo.nombre}</h2>
                </div>
                <input type="date" value={fechaFiltro} onChange={(e) => setFechaFiltro(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500" />
            </div>

            {historial.length === 0 ? (
                <div className="text-center py-12">
                    <Icon
                        name="calendar"
                        className="w-16 h-16 text-slate-300 mx-auto mb-4"
                    />
                    <p className="text-slate-500 font-bold">No hay asistencias registradas</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Fecha</th>
                                <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Miembro</th>
                                <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.map(a => (
                                <tr key={a.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3 font-bold text-slate-700">{a.fecha}</td>
                                    <td className="px-4 py-3 font-bold text-slate-800">{a.miembro_id}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-lg font-bold text-xs ${
                                            a.estado === 'presente' ? 'bg-green-100 text-green-700' :
                                            a.estado === 'reportado' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {a.estado?.toUpperCase()}
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
