// Componente de Login - Formulario de inicio de sesion
const { useState } = React;
const { api } = window;

// Permite informar una expiración de sesión sin crear un estado global adicional en el login.
window.LoginComponent = function ({ onLogin, mensajeInicial = "" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Conserva el mensaje recibido hasta que el usuario intente autenticarse nuevamente.
  const [error, setError] = useState(mensajeInicial);
  const [loading, setLoading] = useState(false);

  // Envia credenciales al servidor
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(username, password);
      if (res.token) {
        onLogin(res);
      } else {
        setError(res.error || "Error al iniciar sesion");
      }
    } catch (err) {
      // Distingue credenciales, validación y conexión usando el contrato del cliente HTTP.
      setError(err.message || "Error al iniciar sesión");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado izquierdo: info visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 items-center justify-center p-12">
        <div className="text-center text-white">
          <i
            data-lucide="church"
            className="w-24 h-24 mx-auto mb-6 opacity-90"
          ></i>
          <h1 className="text-4xl font-black mb-2">
            Iglesia Restauración Familiar
          </h1>
          <p className="text-lg font-bold text-blue-200 uppercase tracking-widest">
            Sistema de Asistencia
          </p>
          <div className="mt-12 border-t border-blue-400/30 pt-8">
            <p className="text-blue-200 font-semibold text-sm">
              *********************
            </p>
          </div>
        </div>
      </div>

      {/* Lado derecho: formulario */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          {/* Version movil del titulo (visible solo en mobile) */}
          <div className="text-center mb-6 lg:hidden">
            <i
              data-lucide="church"
              className="text-blue-700 w-12 h-12 mx-auto mb-3"
            ></i>
            <h1 className="text-2xl font-black text-slate-800">
              Monte Carmelo
            </h1>
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
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
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
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
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
              className="w-full bg-blue-700 text-white py-3 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-blue-800 transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? "Ingresando..." : "Iniciar Sesion"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
