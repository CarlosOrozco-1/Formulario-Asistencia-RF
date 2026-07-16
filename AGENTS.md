# Reglas de Desarrollo - Gestión de Asistencia

## Propósito
Este documento establece las reglas básicas para escribir y mantener el código del proyecto.

## Reglas de Código

### 1. Comentarios obligatorios
- **Toda línea de código agregada o modificada debe ser comentada**
- Los comentarios deben explicar el "qué" y el "por qué", no el "cómo"
- Usar comentarios en Español ya que el proyecto es para usuarios hispanohablantes

### 2. Estructura de archivos
```
/Asistencia-Discipulado
├── server/
│   ├── index.js              # Express app (API + estáticos)
│   ├── package.json
│   ├── database/
│   │   ├── connection.js     # Conexión better-sqlite3
│   │   └── init.sql          # Schema SQL
│   ├── routes/
│   │   ├── auth.js           # Login (POST /api/auth/login)
│   │   ├── asistencias.js    # CRUD asistencias
│   │   └── usuarios.js       # CRUD usuarios (admin)
│   ├── services/
│   │   └── pdf.js            # Generación de PDFs
│   └── middleware/
│       └── auth.js           # JWT verification
├── public/
│   ├── index.html            # Frontend entry point
│   ├── styles.css            # Estilos personalizados
│   ├── app.js                # Orquestador React
│   └── js/
│       ├── config/
│       │   └── constants.js  # Constantes globales
│       ├── services/
│       │   └── api.js        # Fetch wrapper + JWT
│       ├── components/
│       │   ├── login.js      # Pantalla de login
│       │   ├── dashboard.js  # Resumen de asistencias
│       │   ├── discipulado.js# CRUD + asistencia discipulado
│       │   └── pueblo.js     # CRUD + asistencia pueblo
│       └── utils/
│           └── helpers.js    # Funciones helper
├── docs/
│   ├── arquitectura.md       # Arquitectura del sistema
│   ├── db-schema.md          # Esquema de base de datos
│   └── refactorizacion.md    # Historial de cambios
├── database/
│   └── init.sql              # Schema de referencia
├── Dockerfile
├── docker-compose.yml
├── README.md
└── AGENTS.md
```

### 3. Nomenclatura
- **Variables y funciones**: camelCase (ej: `initDB`, `handleStatus`)
- **Constantes**: UPPER_CASE con guiones bajos (ej: `STATUS.PRESENT`)
- **Componentes React**: PascalCase (ej: `DiscipuladoView`, `PuebloView`)
- **Archivos**: kebab-case (ej: `styles.css`, `app.js`)

### 4. Estilo de código
- Usar 4 espacios para indentación
- Máximo 100 caracteres por línea
- Siempre usar `const` y `let`, nunca `var`
- Preferir funciones flecha (arrow functions) cuando sea apropiado

### 5. JavaScript/React
- Usar functional components con hooks (useState, useEffect)
- Desestructurar props cuando sea posible
- Evitar mutaciones directas del estado

### 6. CSS/Tailwind
- Preferir clases de Tailwind sobre CSS personalizado
- Mantener estilos personalizados en `styles.css`
- Usar nombres semánticos para clases personalizadas

### 7. Base de datos
- Usar SQLite con better-sqlite3 (en el servidor)
- Todas las tablas deben tener ID autoincremental
- Usar FOREIGN KEY cuando haya relaciones entre tablas

### 8. PDF
- Usar jsPDF con el plugin autoTable para generar reportes
- Incluir fecha del reporte en el nombre del archivo

### 9. Documentación de API (Postman)
- Todo nuevo endpoint o modificación de uno existente debe ser reflejado en el archivo `postman/asistencia_api.json`
- Mantener ejemplos de body y query params actualizados

## Proceso de desarrollo

1. **Antes de modificar**: Leer el archivo AGENTS.md
2. **Al agregar código**: Agregar comentarios en Español
3. **Al hacer commit**: Verificar que todo esté comentado
4. **Al subir a GitHub**: Asegurar que los archivos estén separados correctamente

## Notas adicionales
- El servidor Express corre en Node.js, sirve API y estáticos
- Los datos se almacenan en asistencias.db en el servidor
- Los PDFs se generan del lado del servidor con jspdf
- Autenticación mediante JWT con expiración de 24h
