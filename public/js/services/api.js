// Servicio de API: comunicacion con el backend Express
// Maneja JWT, endpoints publicos y protegidos
// Representa fallos HTTP y de conexión sin perder código, estado ni detalles de validación.
window.ApiError = class ApiError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = options.status || 0;
        this.code = options.code || 'UNKNOWN_ERROR';
        this.details = options.details || [];
    }
};

window.api = {
    token: null,
    API_URL: '/api',

    // Gestion del token JWT en memoria y localStorage
    setToken: function(t) { this.token = t; localStorage.setItem('rf_token', t); },
    getToken: function() { return this.token || localStorage.getItem('rf_token'); },
    clearToken: function() { this.token = null; localStorage.removeItem('rf_token'); },

    // Ofrece un mensaje estable para consumidores que aún usan alertas durante la transición UI
    getErrorMessage: function(error) {
        if (error?.code === 'NETWORK_ERROR') return 'No hay conexión con el servidor';
        return error?.message || 'La operación no pudo completarse';
    },

    // Convierte cualquier respuesta JSON en datos o en un error tipado para la interfaz
    processResponse: async function(res, rawResponse = false) {
        if (rawResponse && res.ok) return res;

        // Tolera respuestas vacías sin intentar convertirlas en JSON inválido
        const text = await res.text();
        let payload = null;
        if (text) {
            try {
                payload = JSON.parse(text);
            } catch (error) {
                throw new window.ApiError('El servidor devolvió una respuesta inválida', {
                    status: res.status,
                    code: 'INVALID_RESPONSE'
                });
            }
        }

        // Extrae el contrato nuevo y conserva compatibilidad temporal con errores antiguos
        if (!res.ok) {
            const contract = payload?.error;
            const message = contract?.message || contract || 'La solicitud no pudo completarse';
            throw new window.ApiError(message, {
                status: res.status,
                code: contract?.code || 'HTTP_ERROR',
                details: contract?.details || []
            });
        }

        return payload;
    },

    // Ejecuta fetch y diferencia una desconexión de una respuesta HTTP rechazada
    fetchResponse: async function(url, options) {
        try {
            return await fetch(url, options);
        } catch (error) {
            throw new window.ApiError('No fue posible conectar con el servidor', {
                code: 'NETWORK_ERROR'
            });
        }
    },

    // Peticion generica al API (con JWT si existe)
    request: async function(method, path, body) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        const token = this.getToken();
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        if (body) opts.body = JSON.stringify(body);
        const res = await this.fetchResponse(this.API_URL + path, opts);
        // Notifica una sesión vencida sin ocultar errores de credenciales del formulario de login
        if (res.status === 401 && path !== '/auth/login') {
            this.clearToken();
            window.dispatchEvent(new Event('sesion-expirada'));
        }
        return this.processResponse(res, path.includes('/pdf'));
    },

    // Peticion publica (sin JWT) para registro de asistencia del pueblo
    requestPublic: async function(method, path, body) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await this.fetchResponse('/api/publico' + path, opts);
        return this.processResponse(res);
    },

    // Autenticacion
    login: function(u, p) { return this.request('POST', '/auth/login', { username: u, password: p }); },

    // Restaura la sesion validando que el token y el usuario sigan vigentes en el servidor
    getSesion: async function() {
        const token = this.getToken();
        if (!token) return null;

        const res = await this.fetchResponse(this.API_URL + '/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        // Limpia credenciales obsoletas para que la aplicacion pueda volver al login
        if (res.status === 401 || res.status === 403) {
            this.clearToken();
            return null;
        }

        // Conserva el error tipado de red o servidor para ofrecer una opción de reintento
        return this.processResponse(res);
    },

    // Asistencias
    getAsistencias: function(params) { return this.request('GET', '/asistencias?' + new URLSearchParams(params)); },
    createAsistencia: function(data) { return this.request('POST', '/asistencias', data); },
    updateAsistencia: function(id, data) { return this.request('PUT', '/asistencias/' + id, data); },
    deleteAsistencia: function(id) { return this.request('DELETE', '/asistencias/' + id); },
    getResumen: function() { return this.request('GET', '/asistencias/resumen'); },

    // Miembros
    getMiembros: function(params) { return this.request('GET', '/miembros?' + new URLSearchParams(params)); },
    createMiembro: function(data) { return this.request('POST', '/miembros', data); },
    updateMiembro: function(id, data) { return this.request('PUT', '/miembros/' + id, data); },
    deleteMiembro: function(id) { return this.request('DELETE', '/miembros/' + id); },

    // Grupos de discipulado
    getGrupos: function() { return this.request('GET', '/grupos'); },
    createGrupo: function(data) { return this.request('POST', '/grupos', data); },
    updateGrupo: function(id, data) { return this.request('PUT', '/grupos/' + id, data); },
    deleteGrupo: function(id) { return this.request('DELETE', '/grupos/' + id); },

    // Categorias del pueblo
    getCategorias: function() { return this.request('GET', '/categorias'); },
    createCategoria: function(data) { return this.request('POST', '/categorias', data); },
    updateCategoria: function(id, data) { return this.request('PUT', '/categorias/' + id, data); },
    deleteCategoria: function(id) { return this.request('DELETE', '/categorias/' + id); },

    // Usuarios (solo admin)
    getUsuarios: function() { return this.request('GET', '/usuarios'); },
    createUsuario: function(data) { return this.request('POST', '/usuarios', data); },
    updateUsuario: function(id, data) { return this.request('PUT', '/usuarios/' + id, data); },
    updatePassword: function(id, data) { return this.request('PUT', '/usuarios/' + id + '/password', data); },
    deleteUsuario: function(id) { return this.request('DELETE', '/usuarios/' + id); },

    // Pueblo publico (sin JWT)
    registrarAsistenciaPublica: function(data) { return this.requestPublic('POST', '/pueblo/asistencia', data); },

    // Reportes protegidos del pueblo
    getReportesPueblo: function(params) { return this.request('GET', '/pueblo/reportes?' + new URLSearchParams(params)); }
};
