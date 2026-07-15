/**
 * Casos de uso de autenticación sin dependencias de Express o SQLite.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { HttpError } = require('../../utils/http-error');
const { validarTexto } = require('../../utils/validation');

const crearAuthService = ({ repository, jwtSecret }) => ({
    // Valida credenciales, registra acceso y emite la sesión firmada.
    login: ({ username, password }) => {
        const usernameNormalizado = validarTexto(username, 'username', {
            required: true,
            max: 80
        });
        const passwordNormalizado = validarTexto(password, 'password', {
            required: true,
            max: 200,
            trim: false
        });
        const user = repository.findActiveByUsername(usernameNormalizado);
        if (!user || !bcrypt.compareSync(passwordNormalizado, user.password_hash)) {
            throw new HttpError(401, 'INVALID_CREDENTIALS', 'Las credenciales son inválidas');
        }
        repository.updateLastAccess(user.id, new Date().toISOString());
        const identity = {
            id: user.id,
            username: user.username,
            rol: user.rol,
            nombre: user.nombre
        };
        return {
            token: jwt.sign(identity, jwtSecret, { expiresIn: '24h' }),
            usuario: { id: user.id, nombre: user.nombre, rol: user.rol }
        };
    },
    // Confirma que la cuenta del token continúe activa antes de restaurar la SPA.
    getSession: (identity) => {
        const user = repository.findActiveIdentityById(identity.id);
        if (!user) {
            throw new HttpError(401, 'SESSION_UNAVAILABLE', 'La sesión ya no está disponible');
        }
        return { usuario: user };
    }
});

module.exports = { crearAuthService };
