// Componente de Login - Formulario de inicio de sesion
const { useState } = React;
const { api } = window;

window.LoginComponent = function({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Envia credenciales al servidor
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.login(username, password);
            if (res.token) {
                onLogin(res);
            } else {
                setError(res.error || 'Error al iniciar sesion');
            }
        } catch (err) {
            setError('Error de conexion con el servidor');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-700 to-green-900 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <i data-lucide="church" className="text-green-700 w-12 h-12 mx-auto mb-3"></i>
                    <h1 className="text-2xl font-black text-slate-800">Monte Carmelo</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Sistema de Asistencia
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                            Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none font-bold text-sm"
                            placeholder="Ingresa tu usuario"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                            Contrasena
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none font-bold text-sm"
                            placeholder="Ingresa tu contrasena"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold text-center p-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-700 text-white py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-green-800 transition-all disabled:opacity-50 shadow-lg"
                    >
                        {loading ? 'Ingresando...' : 'Iniciar Sesion'}
                    </button>
                </form>

                <style>{`
                    @keyframes spin-slow { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
};
