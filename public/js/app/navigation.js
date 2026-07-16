// Catálogo central de rutas, permisos y navegación de la SPA.
window.AppNavigation = window.AppNavigation || {};

window.AppNavigation.ROUTES = Object.freeze([
    { id: 'dashboard', path: 'dashboard', title: 'Inicio', icon: 'layout-dashboard' },
    { id: 'discipulado', path: 'discipulado', title: 'Discipulado', icon: 'book-open' },
    { id: 'pueblo', path: 'pueblo', title: 'Pueblo', icon: 'building-2' },
    {
        id: 'usuarios',
        path: 'usuarios',
        title: 'Usuarios',
        icon: 'users',
        roles: ['admin']
    }
]);

// Cambia el hash para conservar el historial nativo del navegador.
window.AppNavigation.navigate = path => {
    window.location.hash = `#${path}`;
};

// Normaliza la ubicación inicial y las navegaciones posteriores.
const getCurrentPath = () => window.location.hash.replace(/^#\/?/, '') || 'dashboard';

window.AppHooks.useNavigation = function useNavigation(usuario) {
    const [path, setPath] = React.useState(getCurrentPath);

    // Escucha atrás, adelante y cambios de módulo desde cualquier control de navegación.
    React.useEffect(() => {
        const handleHashChange = () => setPath(getCurrentPath());
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const matchedRoute = window.AppNavigation.ROUTES.find(route => route.path === path);
    const allowedRoutes = window.AppNavigation.ROUTES.filter(route => (
        !route.roles || route.roles.includes(usuario?.rol)
    ));
    const isAllowed = matchedRoute
        && (!matchedRoute.roles || matchedRoute.roles.includes(usuario?.rol));

    // Conserva la URL inválida para mostrar una salida clara en lugar de ocultar el error.
    const route = !matchedRoute
        ? { id: 'not-found', path, title: 'Página no encontrada', icon: 'file-question' }
        : isAllowed
            ? matchedRoute
            : { id: 'forbidden', path, title: 'Acceso restringido', icon: 'shield-off' };

    return {
        route,
        allowedRoutes,
        navigate: window.AppNavigation.navigate
    };
};
