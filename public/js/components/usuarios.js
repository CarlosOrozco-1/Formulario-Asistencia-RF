// Componente Usuarios - Gestion de usuarios del sistema (solo admin)
// CRUD completo: listar, crear, editar, desactivar y cambiar contrasena
const { useState, useEffect } = React;
const { api } = window;
const { Button, Icon, StatusState } = window.UI;

window.UsuariosComponent = function UsuariosComponent({ usuario }) {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    // Carga la lista de usuarios al montar el componente
    useEffect(() => {
        api.getUsuarios().then(data => {
            setUsuarios(data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    // Si no es admin, muestra mensaje de acceso denegado
    if (usuario.rol !== 'admin') {
        return (
            <StatusState
                type="error"
                title="Acceso restringido"
                description="Solo administradores pueden gestionar usuarios."
                actions={(
                    <Button onClick={() => window.AppNavigation.navigate('dashboard')}>
                        Volver al inicio
                    </Button>
                )}
            />
        );
    }

    // Mientras carga
    if (loading) {
        return (
            <StatusState
                type="loading"
                title="Cargando usuarios"
                description="Estamos preparando las cuentas del sistema."
            />
        );
    }

    // Renderizado principal
    return (
        <main className="max-w-6xl mx-auto px-4 py-6">
            <VistaListaUsuarios usuarios={usuarios} setUsuarios={setUsuarios} />
        </main>
    );
};

// ---------------------------------------------------------------------------
// VistaListaUsuarios: Tabla con todos los usuarios y acciones CRUD
// ---------------------------------------------------------------------------
function VistaListaUsuarios({ usuarios, setUsuarios }) {
    const { notify, confirm } = window.useFeedback();
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [rol, setRol] = useState('user');

    // Reinicia el formulario a valores iniciales
    const resetForm = () => {
        setUsername('');
        setPassword('');
        setNombre('');
        setRol('user');
        setEditId(null);
        setShowForm(false);
    };

    // Prepara el formulario para editar un usuario existente
    const handleEdit = (u) => {
        setEditId(u.id);
        setUsername(u.username);
        setNombre(u.nombre);
        setRol(u.rol);
        setShowForm(true);
    };

    // Guarda un usuario nuevo o actualiza uno existente
    const handleSave = async (e) => {
        e.preventDefault();
        if (!username.trim() || !nombre.trim()) return;

        try {
            if (editId) {
                // Actualiza usuario existente (sin password)
                await api.updateUsuario(editId, { nombre: nombre.trim(), rol });
                if (password.trim()) {
                    await api.updatePassword(editId, { password: password.trim() });
                }
                // Refresca la lista
                const data = await api.getUsuarios();
                setUsuarios(data || []);
            } else {
                // Crea nuevo usuario
                if (!password.trim()) {
                    notify('La contraseña es requerida.', { variant: 'warning' });
                    return;
                }
                await api.createUsuario({
                    username: username.trim(),
                    password: password.trim(),
                    nombre: nombre.trim(),
                    rol
                });
                // Refresca la lista después de confirmar la creación.
                const data = await api.getUsuarios();
                setUsuarios(data || []);
            }
            resetForm();
        } catch (error) {
            // Mantiene el formulario abierto y presenta el mensaje contractual de la API.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Desactiva un usuario
    const handleDelete = async (id) => {
        const accepted = await confirm({
            title: 'Desactivar usuario',
            description: 'El usuario ya no podrá iniciar una nueva sesión.',
            confirmLabel: 'Desactivar usuario',
            danger: true
        });
        if (!accepted) return;
        try {
            await api.deleteUsuario(id);
            const data = await api.getUsuarios();
            setUsuarios(data || []);
            notify('El usuario fue desactivado.', { variant: 'success' });
        } catch (error) {
            // Conserva la fila cuando el servidor no confirmó la desactivación.
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    return (
        <div>
            {/* Encabezado */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-slate-700">Gestion de Usuarios</h2>
                <button onClick={() => { resetForm(); setShowForm(!showForm); }}
                    className="bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow flex items-center gap-1">
                    <Icon name="user-plus" className="w-4 h-4" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Formulario de crear/editar */}
            {showForm && (
                <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
                    <h3 className="font-black text-slate-700 mb-4">
                        {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-black text-slate-600 uppercase mb-1">Username</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                                required={!editId} disabled={!!editId} />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-600 uppercase mb-1">
                                {editId ? 'Nueva contrasena (dejar vacio para mantener)' : 'Contrasena'}
                            </label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                                required={!editId} />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-600 uppercase mb-1">Nombre completo</label>
                            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                                required />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-600 uppercase mb-1">Rol</label>
                            <select value={rol} onChange={(e) => setRol(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm">
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit"
                            className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow">
                            {editId ? 'Actualizar' : 'Crear Usuario'}
                        </button>
                        <button type="button" onClick={resetForm}
                            className="bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-300 transition-all">
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Tabla de usuarios */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Usuario</th>
                            <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Nombre</th>
                            <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Rol</th>
                            <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Estado</th>
                            <th className="text-left px-4 py-3 font-black text-slate-600 text-xs uppercase">Ultimo Acceso</th>
                            <th className="text-right px-4 py-3 font-black text-slate-600 text-xs uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(u => (
                            <tr key={u.id} className="border-b border-slate-100">
                                <td className="px-4 py-3 font-bold text-slate-800">{u.username}</td>
                                <td className="px-4 py-3 text-slate-700">{u.nombre}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-lg font-bold text-xs ${
                                        u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {u.rol}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-lg font-bold text-xs ${
                                        u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {u.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs">{u.ultimo_acceso || '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(u)}
                                        className="text-blue-600 hover:text-blue-800 p-1 mr-2"
                                        title="Editar">
                                        <Icon name="edit" className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(u.id)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                        title="Desactivar">
                                        <Icon name="trash-2" className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
