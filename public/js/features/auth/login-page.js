// Pantalla de acceso separada en un módulo funcional independiente.
window.Features = window.Features || {};

// Recupera el cliente HTTP y los componentes compartidos sin acoplar el módulo al arranque.
const { api } = window;
const { Alert, Button, Card, Field, Icon } = window.UI;

// Encapsula el estado del formulario para aislar la lógica de autenticación.
const useLoginForm = (mensajeInicial) => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState(mensajeInicial);
    const [loading, setLoading] = React.useState(false);

    // Envía credenciales y conserva el estado cuando la API rechaza el acceso.
    const submit = async (onLogin, event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.login(username, password);
            if (response.token) {
                onLogin(response);
                return;
            }
            setError(response.error || 'No fue posible iniciar sesión');
        } catch (requestError) {
            setError(requestError.message || 'No fue posible iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return {
        username,
        password,
        error,
        loading,
        setUsername,
        setPassword,
        setError,
        submit
    };
};

// Presenta la marca institucional sin mezclarla con la lógica del formulario.
const LoginBrand = () => (
    <section className="login-brand hidden items-center justify-center p-12 lg:flex">
        <div className="relative z-10 max-w-lg text-center">
            <Icon name="clipboard-check" className="mx-auto mb-7 w-24 h-24 opacity-90" />
            <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-200">
                Control y seguimiento
            </p>
            <h1 className="mt-3 text-5xl font-black">Gestión de Asistencia</h1>
            <p className="mt-5 leading-relaxed text-blue-100">
                Una herramienta sencilla para acompañar y cuidar a nuestra comunidad.
            </p>
        </div>
    </section>
);

// Renderiza el formulario de acceso con el estado recibido desde el hook local.
const LoginForm = ({ form, onLogin }) => (
    <section className="login-form-panel flex items-center justify-center p-5 sm:p-8">
        <Card variant="elevated" className="w-full max-w-md">
            <div className="mb-7 text-center">
                <Icon name="clipboard-check" className="mx-auto mb-3 w-12 h-12 text-blue-700 lg:hidden" />
                <p className="text-xs font-black uppercase tracking-widest text-blue-700">
                    Gestión de Asistencia
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Bienvenido de nuevo
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Ingresa tus credenciales para continuar.
                </p>
            </div>

            <form onSubmit={event => form.submit(onLogin, event)} className="grid gap-5">
                <Field
                    id="login-username"
                    label="Usuario"
                    type="text"
                    value={form.username}
                    onChange={event => form.setUsername(event.target.value)}
                    autoComplete="username"
                    placeholder="Ingresa tu usuario"
                    required
                />
                <Field
                    id="login-password"
                    label="Contraseña"
                    type="password"
                    value={form.password}
                    onChange={event => form.setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    required
                />
                {form.error && (
                    <Alert variant="danger" title="No pudimos iniciar sesión">
                        {form.error}
                    </Alert>
                )}
                <Button type="submit" size="large" fullWidth loading={form.loading}>
                    {form.loading ? 'Validando acceso' : 'Iniciar sesión'}
                </Button>
            </form>
        </Card>
    </section>
);

// Exporta el componente raíz que conecta el hook con la vista presentacional.
window.LoginComponent = function LoginComponent({ onLogin, mensajeInicial = '' }) {
    const form = useLoginForm(mensajeInicial);

    return (
        <main className="login-shell grid lg:grid-cols-2">
            <LoginBrand />
            <LoginForm form={form} onLogin={onLogin} />
        </main>
    );
};
