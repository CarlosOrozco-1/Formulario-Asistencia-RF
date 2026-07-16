// Orquestador de sesión, navegación y composición de módulos autenticados.
const { Button, StatusState } = window.UI;
const { useNavigation, useSession } = window.AppHooks;

function App() {
    const session = useSession();
    const navigation = useNavigation(session.usuario);

    if (session.status === 'anonymous') {
        return <LoginComponent onLogin={session.login} mensajeInicial={session.message} />;
    }

    if (session.status === 'restoring') {
        return (
            <StatusState
                type="loading"
                title="Validando tu sesión"
                description="Esto tomará solo un momento."
                fullPage
            />
        );
    }

    if (session.status === 'error') {
        return (
            <StatusState
                type="error"
                title="No pudimos validar tu sesión"
                description={session.error}
                fullPage
                actions={(
                    <>
                        <Button onClick={session.retry}>Reintentar</Button>
                        <Button variant="secondary" onClick={session.logout}>
                            Volver al login
                        </Button>
                    </>
                )}
            />
        );
    }

    // Resuelve módulos, permisos y URLs inválidas desde el catálogo único de rutas.
    const renderRoute = () => {
        switch (navigation.route.id) {
            case 'discipulado': return <DiscipuladoComponent usuario={session.usuario} />;
            case 'pueblo': return <PuebloComponent usuario={session.usuario} />;
            case 'usuarios': return <UsuariosComponent usuario={session.usuario} />;
            case 'forbidden':
                return (
                    <StatusState
                        type="error"
                        title="No tienes permiso para abrir este módulo"
                        description="Tu cuenta no cuenta con el rol requerido."
                        actions={(
                            <Button onClick={() => navigation.navigate('dashboard')}>
                                Volver al inicio
                            </Button>
                        )}
                    />
                );
            case 'not-found':
                return (
                    <StatusState
                        type="empty"
                        title="La página solicitada no existe"
                        description="Revisa la dirección o vuelve al panel principal."
                        actions={(
                            <Button onClick={() => navigation.navigate('dashboard')}>
                                Ir al inicio
                            </Button>
                        )}
                    />
                );
            default: return <DashboardComponent usuario={session.usuario} />;
        }
    };

    return (
        <AppShell
            usuario={session.usuario}
            route={navigation.route}
            routes={navigation.allowedRoutes}
            onNavigate={navigation.navigate}
            onLogout={session.logout}
        >
            {renderRoute()}
        </AppShell>
    );
}

// Monta proveedores globales una sola vez alrededor del orquestador.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <FeedbackProvider>
        <App />
    </FeedbackProvider>
);
