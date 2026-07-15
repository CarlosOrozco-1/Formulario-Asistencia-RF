// Servicio de API: comunicacion con el backend Express
// Maneja JWT, endpoints publicos y protegidos
window.api = {
    token: null,
    API_URL: '/api',

    // Gestion del token JWT en memoria y localStorage
    setToken: function(t) { this.token = t; localStorage.setItem('rf_token', t); },
    getToken: function() { return this.token || localStorage.getItem('rf_token'); },
    clearToken: function() { this.token = null; localStorage.removeItem('rf_token'); },

    // Peticion generica al API (con JWT si existe)
    request: async function(method, path, body) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        const token = this.getToken();
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(this.API_URL + path, opts);
        if (res.status === 401) { this.clearToken(); window.location.reload(); }
        if (path.includes('/pdf')) return res;
        return res.json();
    },

    // Peticion publica (sin JWT) para registro de asistencia del pueblo
    requestPublic: async function(method, path, body) {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch('/api/publico' + path, opts);
        return res.json();
    },

    // Autenticacion
    login: function(u, p) { return this.request('POST', '/auth/login', { username: u, password: p }); },

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
