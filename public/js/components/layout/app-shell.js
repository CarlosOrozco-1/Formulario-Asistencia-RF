// Estructura autenticada compartida con navegación, contexto y cierre de sesión.
window.AppShell = function AppShell({
    usuario,
    route,
    routes,
    onNavigate,
    onLogout,
    children
}) {
    const { Badge, Button, Icon } = window.UI;

    // Reutiliza un solo control semántico en navegación de escritorio y móvil.
    const NavigationItem = ({ item, mobile = false }) => (
        <button
            type="button"
            className={[
                mobile ? 'app-shell__mobile-link' : 'app-shell__nav-link',
                route.id === item.id ? 'is-active' : ''
            ].filter(Boolean).join(' ')}
            aria-current={route.id === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.path)}
        >
            <Icon name={item.icon} className="w-5 h-5" />
            <span>{item.title}</span>
        </button>
    );

    return (
        <div className="app-shell">
            {/* Permite saltar la cabecera y entrar directo al contenido principal con teclado. */}
            <a className="app-shell__skip-link" href="#main-content">
                Saltar al contenido
            </a>
            <header className="app-shell__header">
                <div className="app-shell__header-row">
                    <button
                        type="button"
                        className="app-shell__brand"
                        onClick={() => onNavigate('dashboard')}
                        aria-label="Ir al inicio"
                    >
                        <Icon name="calendar-check" className="w-8 h-8" />
                        <span>
                            <strong>Gestión de Asistencia</strong>
                            <small>Panel operativo</small>
                        </span>
                    </button>

                    <nav className="app-shell__desktop-nav" aria-label="Navegación principal">
                        {routes.map(item => <NavigationItem key={item.id} item={item} />)}
                    </nav>

                    <div className="app-shell__account">
                        <span className="app-shell__user-name">{usuario.nombre}</span>
                        <Badge variant={usuario.rol === 'admin' ? 'info' : 'neutral'}>
                            {usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="small"
                            onClick={onLogout}
                            aria-label="Cerrar sesión"
                        >
                            <Icon name="log-out" className="w-4 h-4" />
                            <span className="app-shell__logout-label">Salir</span>
                        </Button>
                    </div>
                </div>

                <div className="app-shell__context">
                    <nav className="app-shell__breadcrumbs" aria-label="Ruta actual">
                        <button type="button" onClick={() => onNavigate('dashboard')}>
                            Inicio
                        </button>
                        {route.id !== 'dashboard' && (
                            <>
                                <Icon name="chevron-right" className="w-4 h-4" />
                                <span aria-current="page">{route.title}</span>
                            </>
                        )}
                    </nav>
                    <h1>{route.title}</h1>
                </div>
            </header>

            <main id="main-content" className="app-shell__content">
                {children}
            </main>

            <nav className="app-shell__mobile-nav" aria-label="Navegación móvil">
                {routes.map(item => (
                    <NavigationItem key={item.id} item={item} mobile />
                ))}
            </nav>
        </div>
    );
};
