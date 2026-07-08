# Reglas de Desarrollo - Sistema de Asistencia Monte Carmelo

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
├── index.html              # Estructura HTML y carga de librerías
├── styles.css              # Estilos personalizados
├── app.js                  # Orquestador del enrutamiento y componente raíz
├── js/
│   ├── constants.js        # Configuración inicial, constantes y datos estáticos
│   ├── db.js               # Funciones de persistencia e infraestructura (SQLite)
│   ├── discipulado-view.js # Vista e interactividad para la asistencia del Discipulado
│   └── pueblo-view.js      # Vista e interactividad para la asistencia del Pueblo
├── docs/
│   └── refactorizacion.md  # Detalles del diseño arquitectónico de la refactorización
├── README.md               # Descripción del proyecto
└── AGENTS.md               # Este archivo
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
- Usar SQLite con SQL.js (en el navegador)
- Todas las tablas deben tener ID autoincremental
- Usar FOREIGN KEY cuando haya relaciones entre tablas

### 8. PDF
- Usar jsPDF con el plugin autoTable para generar reportes
- Incluir fecha del reporte en el nombre del archivo

## Proceso de desarrollo

1. **Antes de modificar**: Leer el archivo AGENTS.md
2. **Al agregar código**: Agregar comentarios en Español
3. **Al hacer commit**: Verificar que todo esté comentado
4. **Al subir a GitHub**: Asegurar que los archivos estén separados correctamente

## Notas adicionales
- Este proyecto no requiere servidor backend
- Los datos se almacenan en el navegador del usuario
- Los PDFs son la forma de compartir reportes