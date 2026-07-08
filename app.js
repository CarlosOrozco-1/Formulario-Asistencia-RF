/**
 * Sistema de Asistencia RF
 * Archivo: app.js
 * 
 * Este archivo actúa como el punto de entrada principal (orquestador) de la aplicación.
 * Utiliza los componentes y helpers cargados globalmente en la ventana.
 */

// Extraemos los componentes y funciones necesarios del ámbito global window
const { useState, useEffect } = React;
const { initDB, DiscipuladoView, PuebloView, CODIGO_DISCIPULADO } = window;

/**
 * Componente principal de la aplicación
 * Maneja la navegación entre pestañas y la inicialización de la base de datos
 */
function App() {
    // Estado para guardar la instancia activa de la base de datos SQLite
    const [db, setDb] = useState(null);
    // Control de la pestaña seleccionada (inicia en 'pueblo' por ser la de acceso público)
    const [activeTab, setActiveTab] = useState('pueblo');
    // Estado para gestionar la fecha de registro en formato YYYY-MM-DD
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    // Estado de carga de la base de datos
    const [loading, setLoading] = useState(true);
    // Filtro de servicio religioso seleccionado por el usuario
    const [servicio, setServicio] = useState('');
    // Grupo de servidores seleccionado para el reporte
    const [grupoServidores, setGrupoServidores] = useState('');
    // Almacena si el usuario ya ingresó correctamente el código de discipulado
    const [isDiscipuladoAuthenticated, setIsDiscipuladoAuthenticated] = useState(false);
    // Controla si se visualiza el modal emergente del código de acceso
    const [showCodeModal, setShowCodeModal] = useState(false);
    // Almacena el valor de la clave que el usuario está escribiendo en el modal
    const [codigoIngresado, setCodigoIngresado] = useState('');
    // Mensaje de error a mostrar si el código de acceso es incorrecto
    const [errorCodigo, setErrorCodigo] = useState('');
    // Control de visibilidad del texto de la contraseña en el modal
    const [showPassword, setShowPassword] = useState(false);

    /**
     * Valida el código ingresado y otorga acceso a la vista de Discipulado
     */
    const validarCodigo = () => {
        // Si el valor ingresado coincide con el código requerido de seguridad
        if (codigoIngresado === CODIGO_DISCIPULADO) {
            // Marcamos al usuario como autenticado para el módulo
            setIsDiscipuladoAuthenticated(true);
            // Cerramos el modal de solicitud de clave
            setShowCodeModal(false);
            // Limpiamos el valor temporal del código
            setCodigoIngresado('');
            // Removemos cualquier mensaje de error anterior
            setErrorCodigo('');
            // Redireccionamos a la pestaña de discipulado
            setActiveTab('discipulado');
        } else {
            // Mostramos un mensaje de error y limpiamos el campo de clave
            setErrorCodigo('Código incorrecto. Intenta nuevamente.');
            setCodigoIngresado('');
        }
    };

    /**
     * Maneja el click en la pestaña de Discipulado para validar acceso
     */
    const handleDiscipuladoClick = () => {
        // Si el usuario no ha ingresado la contraseña de seguridad previamente
        if (!isDiscipuladoAuthenticated) {
            // Desplegamos el modal para que introduzca la contraseña
            setShowCodeModal(true);
            // Reseteamos el mensaje de error anterior
            setErrorCodigo('');
            // Limpiamos el texto escrito previamente en el modal
            setCodigoIngresado('');
        } else {
            // Si ya está autenticado, lo redirigimos a la pestaña inmediatamente
            setActiveTab('discipulado');
        }
    };

    // Efecto para inicializar la base de datos local SQLite al montar el componente
    useEffect(() => {
        // Llamamos a la función de inicialización de la base de datos SQLite
        initDB().then(database => {
            // Guardamos la instancia de base de datos en el estado
            setDb(database);
            // Indicamos que ha finalizado la pantalla de carga
            setLoading(false);
        });
    }, []);

    // Efecto para re-crear los iconos de Lucide al cargar, cambiar pestaña o abrir modales
    useEffect(() => {
        // Si no está cargando y la librería Lucide está cargada en la ventana
        if (!loading && window.lucide) {
            // Procesamos el DOM para renderizar todos los iconos vectoriales SVG
            window.lucide.createIcons();
        }
    }, [loading, activeTab, showCodeModal, showPassword]);

    // Si la aplicación está cargando la base de datos SQLite, mostramos el spinner
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className={
                        "w-12 h-12 border-4 border-green-600 border-t-transparent " +
                        "rounded-full animate-spin mx-auto mb-4"
                    }></div>
                    <p className="text-slate-600 font-bold text-sm">Cargando base de datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Barra de navegación principal */}
            <nav className="bg-green-700 text-white p-4 sticky top-0 z-50 shadow-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <i data-lucide="church" className="bg-white/20 p-2 rounded-lg"></i>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">
                                Iglesia Restauración Familiar
                            </h1>
                            <p className="text-[10px] opacity-90 font-bold uppercase tracking-widest">
                                Sistema de Asistencia
                            </p>
                        </div>
                    </div>
                    {/* Botones selectores de pestañas */}
                    <div className="flex gap-1 bg-green-800 p-1 rounded-lg">
                        <button 
                            onClick={handleDiscipuladoClick}
                            className={
                                "px-4 py-2 rounded-lg text-[10px] font-black " +
                                "uppercase transition-all " +
                                (activeTab === 'discipulado' 
                                    ? 'bg-white text-green-800 shadow' 
                                    : 'text-white/70 hover:text-white')
                            }
                        >
                            Discipulado {
                                !isDiscipuladoAuthenticated && 
                                <span className="ml-1">🔒</span>
                            }
                        </button>
                        <button 
                            onClick={() => setActiveTab('pueblo')}
                            className={
                                "px-4 py-2 rounded-lg text-[10px] font-black " +
                                "uppercase transition-all " +
                                (activeTab === 'pueblo' 
                                    ? 'bg-white text-green-800 shadow' 
                                    : 'text-white/70 hover:text-white')
                            }
                        >
                            Pueblo
                        </button>
                    </div>
                </div>
            </nav>

            {/* Renderizado dinámico del módulo de asistencia activo */}
            <main className="max-w-6xl mx-auto w-full p-4 flex-1">
                {activeTab === 'discipulado' && isDiscipuladoAuthenticated ? (
                    <DiscipuladoView db={db} date={date} onDateChange={setDate} />
                ) : activeTab === 'pueblo' ? (
                    <PuebloView 
                        db={db} 
                        date={date} 
                        onDateChange={setDate} 
                        servicio={servicio} 
                        onServicioChange={setServicio} 
                        grupoServidores={grupoServidores} 
                        onGrupoChange={setGrupoServidores} 
                    />
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-500 font-bold">
                            Acceso denegado. Por favor, ingresa el código correcto.
                        </p>
                    </div>
                )}
            </main>
            
            {/* Modal emergente para ingresar clave secreta de discipulado */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        {/* Cabecera del modal */}
                        <div className="flex items-center gap-3 mb-4">
                            <i data-lucide="lock" className="text-green-700" size="28"></i>
                            <h2 className="text-xl font-bold text-slate-900">Acceso Restringido</h2>
                        </div>
                        
                        <p className="text-slate-600 text-sm mb-6">
                            Este módulo requiere un código de acceso. Por favor, ingresa el código.
                        </p>
                        
                        {/* Control de entrada de la contraseña con botón de alternancia */}
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                Código de Acceso
                            </label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ingresa el código..."
                                    value={codigoIngresado}
                                    onChange={e => setCodigoIngresado(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && validarCodigo()}
                                    className={
                                        "w-full px-4 pr-12 py-2 border-2 border-slate-300 " +
                                        "rounded-lg focus:border-green-500 focus:ring-2 " +
                                        "focus:ring-green-500 outline-none text-center " +
                                        "font-mono text-lg"
                                    }
                                    autoFocus
                                />
                                {/* Botón para mostrar/ocultar contraseña visualmente */}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={
                                        "absolute right-3 top-1/2 transform -translate-y-1/2 " +
                                        "text-slate-400 hover:text-slate-600 transition-colors"
                                    }
                                    title={showPassword ? "Ocultar código" : "Mostrar código"}
                                >
                                    <i data-lucide={showPassword ? "eye-off" : "eye"} size="20"></i>
                                </button>
                            </div>
                        </div>
                        
                        {/* Cuadro de error en caso de clave inválida */}
                        {errorCodigo && (
                            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                                <p className="text-red-700 text-sm font-bold">{errorCodigo}</p>
                            </div>
                        )}
                        
                        {/* Botones de acción del modal */}
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => {
                                    setShowCodeModal(false);
                                    setCodigoIngresado('');
                                    setErrorCodigo('');
                                }}
                                className={
                                    "px-4 py-2 rounded-lg text-slate-700 bg-slate-200 " +
                                    "hover:bg-slate-300 font-bold transition-colors"
                                }
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={validarCodigo}
                                className={
                                    "px-4 py-2 rounded-lg text-white bg-green-700 " +
                                    "hover:bg-green-800 font-bold transition-colors " +
                                    "flex items-center gap-2"
                                }
                            >
                                <i data-lucide="unlock" size="16"></i> Validar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Pie de página de la aplicación */}
            <footer className={
                "mt-auto text-center text-slate-400 text-[10px] py-6 " +
                "uppercase tracking-[0.2em] font-bold"
            }>
                Iglesia Restauración Familiar • 2026
            </footer>
        </div>
    );
}

// Inicializar la aplicación React en el elemento root del DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
// Renderizamos el componente principal
root.render(<App />);