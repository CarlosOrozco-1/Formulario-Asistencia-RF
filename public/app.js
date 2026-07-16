// Componente principal - Orquesta la navegacion entre login y vistas protegidas
const { useState, useEffect } = React;
const { api, helpers, CONFIG } = window;
// Consume estados y controles compartidos para evitar variantes globales improvisadas.
const { Button, StatusState } = window.UI;
// Limita la navegación a módulos conocidos para evitar pantallas o estados sin salida.
const VISTAS_VALIDAS = ['dashboard', 'discipulado', 'pueblo', 'usuarios'];

function App() {
    const [token, setToken] = useState(api.getToken());
    const [usuario, setUsuario] = useState(null);
    const [vista, setVista] = useState('dashboard');
    const [restaurandoSesion, setRestaurandoSesion] = useState(Boolean(token));
    const [errorSesion, setErrorSesion] = useState('');
    const [reintentoSesion, setReintentoSesion] = useState(0);
    const [mensajeSesion, setMensajeSesion] = useState('');

    // Refresca los iconos de Lucide despues de cada renderizado
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    // Escuchar cambios en el hash de la URL para navegar entre modulos
    useEffect(() => {
        const onHashChange = () => {
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            // Redirige hashes desconocidos al dashboard para mantener una navegación recuperable.
            if (!VISTAS_VALIDAS.includes(hash)) {
                window.location.hash = 'dashboard';
                return;
            }
            setVista(hash);
        };
        window.addEventListener('hashchange', onHashChange);
        onHashChange();
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [token]);

    // Sincroniza la interfaz cuando una petición protegida informa que el token expiró.
    useEffect(() => {
        const onSesionExpirada = () => {
            setToken(null);
            setUsuario(null);
            setErrorSesion('');
            setMensajeSesion('Tu sesión expiró. Inicia sesión nuevamente.');
            window.location.hash = '';
        };

        window.addEventListener('sesion-expirada', onSesionExpirada);
        return () => window.removeEventListener('sesion-expirada', onSesionExpirada);
    }, []);

    // Restaura la identidad desde el servidor cuando existe un token guardado.
    useEffect(() => {
        let activo = true;

        // Evita validar de nuevo una sesión que ya tiene identidad o que fue cerrada.
        if (!token || usuario) {
            setRestaurandoSesion(false);
            return () => { activo = false; };
        }

        // Mantiene un estado explícito para distinguir carga, error y sesión inválida.
        const restaurarSesion = async () => {
            setRestaurandoSesion(true);
            setErrorSesion('');

            try {
                const data = await api.getSesion();
                if (!activo) return;

                // Recupera al usuario cuando el servidor confirma una sesión vigente.
                if (data?.usuario) {
                    setUsuario(data.usuario);
                    return;
                }

                // Regresa al login cuando el token expiró o el usuario fue desactivado.
                setMensajeSesion('Tu sesión expiró o el usuario ya no está activo.');
                setToken(null);
            } catch (error) {
                if (activo) setErrorSesion('No se pudo validar la sesión con el servidor.');
            } finally {
                if (activo) setRestaurandoSesion(false);
            }
        };

        restaurarSesion();
        return () => { activo = false; };
    }, [token, reintentoSesion]);

    // Manejador de login exitoso: guarda token y datos del usuario
    const handleLogin = (data) => {
        api.setToken(data.token);
        setToken(data.token);
        setUsuario(data.usuario);
        setErrorSesion('');
        setMensajeSesion('');
    };

    // Cierra sesion: limpia token y estado
    const handleLogout = () => {
        api.clearToken();
        setToken(null);
        setUsuario(null);
        setErrorSesion('');
        setMensajeSesion('');
        window.location.hash = '';
    };

    // Sin token: mostrar pantalla de login
    if (!token) {
        return <LoginComponent onLogin={handleLogin} mensajeInicial={mensajeSesion} />;
    }

    // Durante la validación inicial se presenta un estado de carga acotado.
    if (restaurandoSesion) {
        return <Cargando />;
    }

    // Un fallo temporal conserva la sesión y permite reintentar o cerrarla manualmente.
    if (errorSesion) {
        return (
            <ErrorSesion
                mensaje={errorSesion}
                onReintentar={() => setReintentoSesion(valor => valor + 1)}
                onSalir={handleLogout}
            />
        );
    }

    // Evita renderizar módulos protegidos sin una identidad confirmada.
    if (!usuario) {
        return <LoginComponent onLogin={handleLogin} mensajeInicial={mensajeSesion} />;
    }

    // Usuario autenticado: mostrar vista segun el hash de la URL
    switch (vista) {
        case 'discipulado':
            return (
                <DiscipuladoComponent
                    usuario={usuario}
                    onBack={() => { window.location.hash = 'dashboard'; }}
                />
            );
        case 'pueblo':
            return (
                <PuebloComponent
                    usuario={usuario}
                    onBack={() => { window.location.hash = 'dashboard'; }}
                />
            );
        case 'usuarios':
            return (
                <UsuariosComponent
                    usuario={usuario}
                    onBack={() => { window.location.hash = 'dashboard'; }}
                />
            );
        default:
            return <DashboardComponent usuario={usuario} onLogout={handleLogout} />;
    }
}

function Cargando() {
    return (
        <StatusState
            type="loading"
            title="Validando tu sesión"
            description="Esto tomará solo un momento."
            fullPage
        />
    );
}

// Presenta una salida recuperable cuando el servidor no puede validar la sesión.
function ErrorSesion({ mensaje, onReintentar, onSalir }) {
    return (
        <StatusState
            type="error"
            title="No pudimos validar tu sesión"
            description={mensaje}
            fullPage
            actions={(
                <>
                    <Button onClick={onReintentar}>Reintentar</Button>
                    <Button variant="secondary" onClick={onSalir}>Volver al login</Button>
                </>
            )}
        />
    );
}

// Montar la aplicacion en el DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
