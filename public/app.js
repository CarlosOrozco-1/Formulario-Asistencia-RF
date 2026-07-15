// Componente principal - Orquesta la navegacion entre login y vistas protegidas
const { useState, useEffect } = React;
const { api, helpers, CONFIG } = window;

function App() {
    const [token, setToken] = useState(api.getToken());
    const [usuario, setUsuario] = useState(null);
    const [vista, setVista] = useState('dashboard');

    // Refresca los iconos de Lucide despues de cada renderizado
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    // Escuchar cambios en el hash de la URL para navegar entre modulos
    useEffect(() => {
        const onHashChange = () => {
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            setVista(hash);
        };
        window.addEventListener('hashchange', onHashChange);
        onHashChange();
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [token]);

    // Manejador de login exitoso: guarda token y datos del usuario
    const handleLogin = (data) => {
        api.setToken(data.token);
        setToken(data.token);
        setUsuario(data.usuario);
    };

    // Cierra sesion: limpia token y estado
    const handleLogout = () => {
        api.clearToken();
        setToken(null);
        setUsuario(null);
        window.location.hash = '';
    };

    // Sin token: mostrar pantalla de login
    if (!token) {
        return <LoginComponent onLogin={handleLogin} />;
    }

    // Con token pero sin datos del usuario: mostrar carga
    if (!usuario) {
        return <Cargando />;
    }

    // Usuario autenticado: mostrar vista segun el hash de la URL
    switch (vista) {
        case 'discipulado':
            return <DiscipuladoComponent usuario={usuario} onBack={() => window.location.hash = 'dashboard'} />;
        case 'pueblo':
            return <PuebloComponent usuario={usuario} onBack={() => window.location.hash = 'dashboard'} />;
        case 'usuarios':
            return <UsuariosComponent usuario={usuario} onBack={() => window.location.hash = 'dashboard'} />;
        default:
            return <DashboardComponent usuario={usuario} onLogout={handleLogout} />;
    }
}

function Cargando() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-slate-600 font-bold text-lg animate-pulse">Cargando...</p>
        </div>
    );
}

// Montar la aplicacion en el DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
