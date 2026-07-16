// Módulo funcional de Usuarios separado para aislar permisos y CRUD administrativo.
window.Features = window.Features || {};

// Controla la carga inicial para que la vista se enfoque en la tabla y el formulario.
const useUsuariosPage = usuario => {
    const [usuarios, setUsuarios] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    // Obtiene las cuentas activas una sola vez al entrar al módulo.
    React.useEffect(() => {
        let active = true;
        api.getUsuarios().then(data => {
            if (!active) return;
            setUsuarios(data || []);
            setLoading(false);
        }).catch(() => {
            if (!active) return;
            setLoading(false);
        });
        return () => {
            active = false;
        };
    }, []);

    return { usuarios, setUsuarios, loading, usuario };
};

// Exporta el módulo con el mismo contrato que consumía el orquestador.
window.UsuariosComponent = function UsuariosComponent({ usuario }) {
    const page = useUsuariosPage(usuario);

    if (page.usuario.rol !== 'admin') {
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

    if (page.loading) {
        return (
            <StatusState
                type="loading"
                title="Cargando usuarios"
                description="Estamos preparando las cuentas del sistema."
            />
        );
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-6">
            <VistaListaUsuarios usuarios={page.usuarios} setUsuarios={page.setUsuarios} />
        </main>
    );
};

// Tabla y formulario de administración con manejo de errores recuperable.
function VistaListaUsuarios({ usuarios, setUsuarios }) {
    const { notify, confirm } = window.useFeedback();
    const [showForm, setShowForm] = React.useState(false);
    const [editId, setEditId] = React.useState(null);
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [nombre, setNombre] = React.useState('');
    const [rol, setRol] = React.useState('user');

    // Devuelve el formulario a un estado limpio para crear otra cuenta sin residuos.
    const resetForm = () => {
        setUsername('');
        setPassword('');
        setNombre('');
        setRol('user');
        setEditId(null);
        setShowForm(false);
    };

    // Prepara el formulario para editar una cuenta ya existente.
    const handleEdit = u => {
        setEditId(u.id);
        setUsername(u.username);
        setNombre(u.nombre);
        setRol(u.rol);
        setShowForm(true);
    };

    // Crea o actualiza una cuenta y recarga la lista para evitar estados locales desfasados.
    const handleSave = async event => {
        event.preventDefault();
        if (!username.trim() || !nombre.trim()) return;

        try {
            if (editId) {
                await api.updateUsuario(editId, { nombre: nombre.trim(), rol });
                if (password.trim()) {
                    await api.updatePassword(editId, { password: password.trim() });
                }
                const data = await api.getUsuarios();
                setUsuarios(data || []);
            } else {
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
                const data = await api.getUsuarios();
                setUsuarios(data || []);
            }
            resetForm();
        } catch (error) {
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    // Desactiva una cuenta con confirmación para proteger acciones administrativas.
    const handleDelete = async id => {
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
            notify(api.getErrorMessage(error), { variant: 'danger' });
        }
    };

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-700">Gestión de Usuarios</h2>
                <button
                    type="button"
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow transition-all hover:bg-blue-800"
                >
                    <Icon name="user-plus" className="h-4 w-4" />
                    Nuevo Usuario
                </button>
            </div>

            {showForm && (
                <form
                    onSubmit={handleSave}
                    className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <h3 className="mb-4 font-black text-slate-700">
                        {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h3>
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={event => setUsername(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                required={!editId}
                                disabled={Boolean(editId)}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                                {editId ? 'Nueva contraseña (dejar vacía para mantener)' : 'Contraseña'}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                required={!editId}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                                Nombre completo
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={event => setNombre(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-black uppercase text-slate-600">
                                Rol
                            </label>
                            <select
                                value={rol}
                                onChange={event => setRol(event.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="user">Usuario</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-blue-800"
                        >
                            {editId ? 'Actualizar' : 'Crear Usuario'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-300"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            <div className="ui-table-shell">
                <table className="ui-table text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                Usuario
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                Nombre
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                Rol
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                Estado
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-black uppercase text-slate-600">
                                Último Acceso
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-black uppercase text-slate-600">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(usuario => (
                            <tr key={usuario.id} className="border-b border-slate-100">
                                <td data-label="Usuario" className="font-bold text-slate-800">
                                    {usuario.username}
                                </td>
                                <td data-label="Nombre" className="text-slate-700">
                                    {usuario.nombre}
                                </td>
                                <td data-label="Rol">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${
                                        usuario.rol === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {usuario.rol}
                                    </span>
                                </td>
                                <td data-label="Estado">
                                    <span className={`rounded-lg px-2 py-1 text-xs font-bold ${
                                        usuario.activo
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {usuario.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td data-label="Último acceso" className="text-xs text-slate-500">
                                    {usuario.ultimo_acceso || '—'}
                                </td>
                                <td data-label="Acciones" className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(usuario)}
                                        className="mr-2 p-1 text-blue-600 hover:text-blue-800"
                                        title="Editar"
                                        aria-label={`Editar usuario ${usuario.username}`}
                                    >
                                        <Icon name="edit" className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(usuario.id)}
                                        className="p-1 text-red-600 hover:text-red-800"
                                        title="Desactivar"
                                        aria-label={`Desactivar usuario ${usuario.username}`}
                                    >
                                        <Icon name="trash-2" className="h-4 w-4" />
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
