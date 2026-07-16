// Componente Dashboard - Resumen de asistencias y navegacion principal
const { useState, useEffect } = React;
const { api, CONFIG } = window;
const { Icon, StatusState } = window.UI;

window.DashboardComponent = function({ usuario }) {
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar resumen al montar el componente
    useEffect(() => {
        api.getResumen().then(data => {
            setResumen(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Mientras carga
    if (loading) {
        return (
            <StatusState
                type="loading"
                title="Cargando resumen"
                description="Estamos preparando los indicadores del día."
            />
        );
    }

    // Si no hay resumen (error)
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

/**
 * Vista del dashboard con resumen de asistencias y acceso a modulos
 */
function DashboardView({ resumen, usuario }) {
    return (
        <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Tarjetas de resumen */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <TarjetaResumen
                        icon="calendar-check"
                        label="Asistencias Hoy"
                        valor={resumen.asistenciasHoy}
                        color="green"
                    />
                    <TarjetaResumen
                        icon="users"
                        label="Total Miembros"
                        valor={resumen.totalMiembros}
                        color="blue"
                    />
                    <TarjetaResumen
                        icon="book-open"
                        label="Discipulado"
                        valor={resumen.miembrosPorTipo?.find(m => m.tipo === 'discipulado')?.total || 0}
                        color="purple"
                    />
                    <TarjetaResumen
                        icon="building"
                        label="Pueblo"
                        valor={resumen.miembrosPorTipo?.find(m => m.tipo === 'pueblo')?.total || 0}
                        color="orange"
                    />
                </div>

                {/* Grupos de discipulado */}
                {resumen.grupos && resumen.grupos.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-black text-slate-700 mb-3 flex items-center gap-2">
                            <Icon name="layers" className="w-5 h-5 text-purple-600" />
                            Grupos de Discipulado
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {resumen.grupos.map(grupo => (
                                <div key={grupo.id}
                                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all">
                                    <h3 className="font-black text-slate-800">{grupo.nombre}</h3>
                                    {grupo.lugar && (
                                        <p className="text-xs text-slate-500 font-bold mt-1">
                                            <Icon
                                                name="map-pin"
                                                className="w-3 h-3 inline mr-1"
                                            />
                                            {grupo.lugar}
                                        </p>
                                    )}
                                    <p className="text-2xl font-black text-purple-700 mt-2">{grupo.miembros_count}</p>
                                    <p className="text-xs text-slate-500 font-bold">integrantes</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Categorias de pueblo */}
                {resumen.categorias && resumen.categorias.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-black text-slate-700 mb-3 flex items-center gap-2">
                            <Icon name="building-2" className="w-5 h-5 text-orange-600" />
                            Categorias del Pueblo
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {resumen.categorias.map(cat => (
                                <span key={cat.id}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">
                                    {cat.nombre}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Acceso a modulos */}
                <section>
                    <h2 className="text-lg font-black text-slate-700 mb-3">Modulos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ModuloCard
                            icon="book-open"
                            titulo="Discipulado"
                            descripcion="Gestion de grupos, integrantes y registro de asistencia"
                            color="purple"
                            onClick={() => window.AppNavigation.navigate('discipulado')}
                        />
                        <ModuloCard
                            icon="building"
                            titulo="Pueblo"
                            descripcion="Registro de asistencia del pueblo por categorias"
                            color="orange"
                            onClick={() => window.AppNavigation.navigate('pueblo')}
                        />
                        {usuario.rol === 'admin' && (
                            <ModuloCard
                                icon="users"
                                titulo="Usuarios"
                                descripcion="Gestion de usuarios del sistema (solo admin)"
                                color="green"
                                onClick={() => window.AppNavigation.navigate('usuarios')}
                            />
                        )}
                    </div>
                </section>
        </main>
    );
}

/**
 * Tarjeta de resumen con icono, label y valor
 */
function TarjetaResumen({ icon, label, valor, color }) {
    const colores = {
        green: 'bg-green-50 border-green-200 text-green-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700'
    };

    return (
        <div className={`rounded-2xl border p-5 ${colores[color] || colores.blue}`}>
            <div className="flex items-center gap-3">
                <Icon name={icon} className="w-8 h-8 opacity-70" />
                <div>
                    <p className="text-xs font-black uppercase tracking-wider opacity-70">{label}</p>
                    <p className="text-3xl font-black mt-0.5">{valor}</p>
                </div>
            </div>
        </div>
    );
}

/**
 * Tarjeta de acceso a modulo
 */
function ModuloCard({ icon, titulo, descripcion, color, onClick }) {
    const colores = {
        purple: 'from-purple-500 to-purple-700',
        orange: 'from-orange-500 to-orange-700',
        green: 'from-green-500 to-green-700'
    };

    return (
        <button onClick={onClick}
            className={`bg-gradient-to-br ${colores[color] || colores.green} rounded-2xl p-6 text-white text-left shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}>
            <Icon name={icon} className="w-10 h-10 mb-3 opacity-80" />
            <h3 className="text-xl font-black mb-1">{titulo}</h3>
            <p className="text-sm font-bold opacity-80">{descripcion}</p>
        </button>
    );
}
