// Módulo funcional del dashboard separado para aislar resumen y presentación.
window.Features = window.Features || {};

// Recupera el resumen de negocio sin mezclar la lectura de datos con el render.
const useDashboardSummary = () => {
    const [resumen, setResumen] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    // Carga el tablero una sola vez y deja el estado listo para la vista.
    React.useEffect(() => {
        let active = true;
        api.getResumen().then(data => {
            if (!active) return;
            setResumen(data);
            setLoading(false);
        }).catch(() => {
            if (!active) return;
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    return { resumen, loading };
};

// Obtiene el total por tipo sin repetir la búsqueda en cada tarjeta del tablero.
const obtenerTotalPorTipo = (resumen, tipo) => (
    resumen?.personasPorTipo?.find(item => item.tipo === tipo)?.total || 0
);

// Tarjeta pequeña de información para representar un indicador del tablero.
const DashboardMetric = ({ icon, label, value, color }) => {
    const colors = {
        green: 'bg-green-50 border-green-200 text-green-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700'
    };

    return (
        <div className={`rounded-2xl border p-5 ${colors[color] || colors.blue}`}>
            <div className="flex items-center gap-3">
                <Icon name={icon} className="h-8 w-8 opacity-70" />
                <div>
                    <p className="text-xs font-black uppercase tracking-wider opacity-70">{label}</p>
                    <p className="mt-0.5 text-3xl font-black">{value}</p>
                </div>
            </div>
        </div>
    );
};

// Tarjeta de acceso a módulo para conservar la navegación visual del panel.
const DashboardModuleCard = ({ icon, titulo, descripcion, color, onClick }) => {
    const gradients = {
        purple: 'from-purple-500 to-purple-700',
        orange: 'from-orange-500 to-orange-700',
        green: 'from-green-500 to-green-700'
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl bg-gradient-to-br ${gradients[color] || gradients.green} p-6 text-left text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl`}
        >
            <Icon name={icon} className="mb-3 h-10 w-10 opacity-80" />
            <h3 className="mb-1 text-xl font-black">{titulo}</h3>
            <p className="text-sm font-bold opacity-80">{descripcion}</p>
        </button>
    );
};

// Orquesta la carga y la vista del dashboard con fronteras claras.
window.DashboardComponent = function DashboardComponent({ usuario }) {
    const { resumen, loading } = useDashboardSummary();

    if (loading) {
        return (
            <StatusState
                type="loading"
                title="Cargando resumen"
                description="Estamos preparando los indicadores del día."
            />
        );
    }

    if (!resumen) {
        return (
            <StatusState
                type="error"
                title="No fue posible cargar el resumen"
                description="Actualiza la página para volver a intentarlo."
            />
        );
    }

    return <DashboardView resumen={resumen} usuario={usuario} />;
};

// Vista presentacional del tablero con métricas, secciones y accesos a módulos.
function DashboardView({ resumen, usuario }) {
    const registrosHoy = resumen.registrosHoy ?? resumen.asistenciasHoy ?? 0;
    const personasHoy = resumen.personasHoy ?? 0;
    const discipuladoHoy = obtenerTotalPorTipo(resumen, 'discipulado');
    const puebloHoy = obtenerTotalPorTipo(resumen, 'pueblo');

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
                <DashboardMetric
                    icon="file-text"
                    label="Registros hoy"
                    value={registrosHoy}
                    color="blue"
                />
                <DashboardMetric
                    icon="users"
                    label="Personas hoy"
                    value={personasHoy}
                    color="green"
                />
                <DashboardMetric
                    icon="book-open"
                    label="Discipulado hoy"
                    value={discipuladoHoy}
                    color="purple"
                />
                <DashboardMetric
                    icon="building-2"
                    label="Pueblo hoy"
                    value={puebloHoy}
                    color="orange"
                />
            </div>

            {resumen.grupos && resumen.grupos.length > 0 && (
                <section className="mb-8">
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-700">
                        <Icon name="layers" className="h-5 w-5 text-purple-600" />
                        Grupos de Discipulado
                    </h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {resumen.grupos.map(grupo => (
                            <div
                                key={grupo.id}
                                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                            >
                                <h3 className="font-black text-slate-800">{grupo.nombre}</h3>
                                {grupo.lugar && (
                                    <p className="mt-1 text-xs font-bold text-slate-500">
                                        <Icon name="map-pin" className="mr-1 inline h-3 w-3" />
                                        {grupo.lugar}
                                    </p>
                                )}
                                <p className="mt-2 text-2xl font-black text-purple-700">
                                    {grupo.miembros_count}
                                </p>
                                <p className="text-xs font-bold text-slate-500">integrantes</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {resumen.categorias && resumen.categorias.length > 0 && (
                <section className="mb-8">
                    <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-700">
                        <Icon name="building-2" className="h-5 w-5 text-orange-600" />
                        Categorías del Pueblo
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {resumen.categorias.map(cat => (
                            <span
                                key={cat.id}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm"
                            >
                                {cat.nombre}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <h2 className="mb-3 text-lg font-black text-slate-700">Módulos</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <DashboardModuleCard
                        icon="book-open"
                        titulo="Discipulado"
                        descripcion="Gestiona grupos, integrantes y registro de asistencia."
                        color="purple"
                        onClick={() => window.AppNavigation.navigate('discipulado')}
                    />
                    <DashboardModuleCard
                        icon="building-2"
                        titulo="Pueblo"
                        descripcion="Controla categorías y reportes de asistencia."
                        color="orange"
                        onClick={() => window.AppNavigation.navigate('pueblo')}
                    />
                    {usuario.rol === 'admin' && (
                        <DashboardModuleCard
                            icon="users"
                            titulo="Usuarios"
                            descripcion="Administra cuentas del sistema."
                            color="green"
                            onClick={() => window.AppNavigation.navigate('usuarios')}
                        />
                    )}
                </div>
            </section>
        </main>
    );
}
