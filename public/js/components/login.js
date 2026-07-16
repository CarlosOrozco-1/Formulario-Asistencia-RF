// Pantalla de acceso migrada a los fundamentos visuales de Monte Carmelo.
const { useState } = React;
const { api } = window;
const { Alert, Button, Card, Field } = window.UI;

// Permite informar una expiración de sesión dentro del mismo formulario recuperable.
window.LoginComponent = function LoginComponent({ onLogin, mensajeInicial = '' }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(mensajeInicial);
    const [loading, setLoading] = useState(false);

    // Envía credenciales y conserva los datos cuando el servidor rechaza la solicitud.
    const handleSubmit = async event => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.login(username, password);
            if (response.token) {
                onLogin(response);
            } else {
                setError(response.error || 'No fue posible iniciar sesión');
            }
        } catch (requestError) {
            setError(requestError.message || 'No fue posible iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-shell grid lg:grid-cols-2">
            {/* Presenta la identidad institucional sin duplicar controles operativos. */}
            <section className="login-brand hidden lg:flex items-center justify-center p-12">
                <div className="relative z-10 max-w-lg text-center">
                    <i data-lucide="church" className="w-24 h-24 mx-auto mb-7 opacity-90" />
                    <p className="text-sm font-black uppercase tracking-[0.28em] text-blue-200">
                        Sistema de Asistencia
                    </p>
                    <h1 className="text-5xl font-black mt-3">Monte Carmelo</h1>
                    <p className="text-blue-100 mt-5 leading-relaxed">
                        Una herramienta sencilla para acompañar y cuidar a nuestra comunidad.
                    </p>
                </div>
            </section>

            {/* Mantiene el formulario como único punto de interacción de la pantalla. */}
            <section className="login-form-panel flex items-center justify-center p-5 sm:p-8">
                <Card variant="elevated" className="w-full max-w-md">
                    <div className="text-center mb-7">
                        <i
                            data-lucide="church"
                            className="text-blue-700 w-12 h-12 mx-auto mb-3 lg:hidden"
                        />
                        <p className="text-xs font-black uppercase tracking-widest text-blue-700">
                            Monte Carmelo
                        </p>
                        <h2 className="text-2xl font-black text-slate-900 mt-2">
                            Bienvenido de nuevo
                        </h2>
                        <p className="text-sm text-slate-500 mt-2">
                            Ingresa tus credenciales para continuar.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid gap-5">
                        <Field
                            id="login-username"
                            label="Usuario"
                            type="text"
                            value={username}
                            onChange={event => setUsername(event.target.value)}
                            autoComplete="username"
                            placeholder="Ingresa tu usuario"
                            required
                        />
                        <Field
                            id="login-password"
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            autoComplete="current-password"
                            placeholder="Ingresa tu contraseña"
                            required
                        />
                        {error && (
                            <Alert variant="danger" title="No pudimos iniciar sesión">
                                {error}
                            </Alert>
                        )}
                        <Button type="submit" size="large" fullWidth loading={loading}>
                            {loading ? 'Validando acceso' : 'Iniciar sesión'}
                        </Button>
                    </form>
                </Card>
            </section>
        </main>
    );
};
