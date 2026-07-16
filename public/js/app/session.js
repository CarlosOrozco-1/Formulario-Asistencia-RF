// Hook central de sesión para autenticar, restaurar y cerrar la identidad actual.
window.AppHooks = window.AppHooks || {};

window.AppHooks.useSession = function useSession() {
    const { api } = window;
    const [token, setToken] = React.useState(api.getToken());
    const [usuario, setUsuario] = React.useState(null);
    const [restoring, setRestoring] = React.useState(Boolean(token));
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [retryKey, setRetryKey] = React.useState(0);

    // Sincroniza el estado local cuando el cliente HTTP detecta una sesión vencida.
    React.useEffect(() => {
        const handleExpiredSession = () => {
            setToken(null);
            setUsuario(null);
            setRestoring(false);
            setError('');
            setMessage('Tu sesión expiró. Inicia sesión nuevamente.');
            window.history.replaceState(null, '', window.location.pathname);
        };
        window.addEventListener('sesion-expirada', handleExpiredSession);
        return () => window.removeEventListener('sesion-expirada', handleExpiredSession);
    }, []);

    // Confirma con el servidor que el token guardado todavía representa una cuenta activa.
    React.useEffect(() => {
        let active = true;
        if (!token || usuario) {
            setRestoring(false);
            return () => { active = false; };
        }

        const restoreSession = async () => {
            setRestoring(true);
            setError('');
            try {
                const data = await api.getSesion();
                if (!active) return;
                if (data?.usuario) {
                    setUsuario(data.usuario);
                    return;
                }
                setMessage('Tu sesión expiró o el usuario ya no está activo.');
                setToken(null);
            } catch (requestError) {
                if (active) setError('No se pudo validar la sesión con el servidor.');
            } finally {
                if (active) setRestoring(false);
            }
        };

        restoreSession();
        return () => { active = false; };
    }, [token, retryKey, usuario]);

    // Registra conjuntamente token e identidad después de un login confirmado.
    const login = data => {
        api.setToken(data.token);
        setToken(data.token);
        setUsuario(data.usuario);
        setRestoring(false);
        setError('');
        setMessage('');
    };

    // Limpia credenciales y la URL protegida sin agregar una entrada al historial.
    const logout = () => {
        api.clearToken();
        setToken(null);
        setUsuario(null);
        setRestoring(false);
        setError('');
        setMessage('');
        window.history.replaceState(null, '', window.location.pathname);
    };

    // Expone un estado único para evitar combinaciones ambiguas en el componente raíz.
    const status = !token
        ? 'anonymous'
        : restoring
            ? 'restoring'
            : error
                ? 'error'
                : usuario
                    ? 'authenticated'
                    : 'anonymous';

    return {
        status,
        usuario,
        error,
        message,
        login,
        logout,
        retry: () => setRetryKey(value => value + 1)
    };
};
