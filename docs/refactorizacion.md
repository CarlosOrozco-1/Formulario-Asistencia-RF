# Detalles de la Refactorización - Módulos en Navegador (Babel Standalone)

Este documento detalla la estructura y el propósito de los archivos creados durante la refactorización del Sistema de Asistencia Monte Carmelo. El objetivo principal fue separar las responsabilidades (Separación de Conceptos) y reducir la complejidad del archivo monolithic `app.js` (>1200 líneas) a archivos pequeños, mantenibles y especializados.

---

## Nueva Estructura del Código

```
/Asistencia-Discipulado
├── index.html              # Estructura del DOM, carga de librerías y componentes
├── styles.css              # Estilos personalizados de la aplicación
├── app.js                  # Orquestador del enrutamiento y componente raíz <App />
├── js/
│   ├── constants.js        # Configuración inicial, constantes y datos estáticos
│   ├── db.js               # Funciones de persistencia e infraestructura (SQLite + SQL.js)
│   ├── discipulado-view.js # Componente React del listado y asistencia del Discipulado
│   └── pueblo-view.js      # Componente React del control de asistencia del Pueblo
├── docs/
│   └── refactorizacion.md  # Este archivo con el detalle técnico de la reestructuración
├── README.md               # Descripción global del repositorio
└── AGENTS.md               # Normas de desarrollo del proyecto
```

---

## Decisiones de Diseño: Resolución de Módulos sin Build Steps

Para mantener la aplicación compatible con **GitHub Pages** (servidor puramente estático) sin obligar a usar compiladores complejos del lado del servidor (como Webpack, Vite o npm build), se implementó una **arquitectura de namespaces sobre el objeto global `window`** integrada con **Babel Standalone**:

### El Problema de ES6 Modules Nativos con JSX
Si utilizáramos `import` y `export` de ES6 nativos en el navegador, el navegador intentaría resolver y descargar los archivos importados de forma directa. Dado que los componentes React (`discipulado-view.js` y `pueblo-view.js`) contienen sintaxis **JSX** (ej: `<div className="...">`), el motor del navegador arrojaría un error de sintaxis (`SyntaxError: Unexpected token '<'`) al intentar leerlos antes de que puedan ser compilados, ya que Babel Standalone no puede interceptar dinámicamente las solicitudes del cargador de módulos nativo de la web.

### La Solución: Carga Secuencial por Babel y Namespace `window`
1.  **Carga Secuencial:** Registramos las vistas y utilidades como scripts de Babel en el orden correcto dentro de `index.html`:
    ```html
    <script type="text/babel" src="js/constants.js"></script>
    <script type="text/babel" src="js/db.js"></script>
    <script type="text/babel" src="js/discipulado-view.js"></script>
    <script type="text/babel" src="js/pueblo-view.js"></script>
    <script type="text/babel" src="app.js"></script>
    ```
    Babel Standalone descarga cada script secuencialmente, los transpila a Javascript estándar y los ejecuta en el orden exacto de definición.

2.  **Namespace Global:** Dado que Babel envuelve cada script transpilado en un scope de función local independiente, la comunicación de módulos se realiza registrando explícitamente los componentes y utilidades dentro de un espacio compartido en `window`:
    *   `js/constants.js` expone `window.STATUS`, `window.INITIAL_MEMBERS`, etc.
    *   `js/db.js` consume las constantes del ámbito global y expone `window.initDB` y `window.saveDatabase`.
    *   `js/discipulado-view.js` y `js/pueblo-view.js` exponen `window.DiscipuladoView` y `window.PuebloView`.
    *   `app.js` extrae estas referencias de la ventana global y monta el componente `<App />` principal.

---

## Arquitectura de Módulos

### 1. Configuración Global (`js/constants.js`)
*   **Propósito:** Almacenar de manera centralizada la configuración del sistema.
*   **Contenido:** Definición de estados de asistencia, listado de miembros y departamentos iniciales, y contraseña secreta del discipulado.

### 2. Capa de Infraestructura y Datos (`js/db.js`)
*   **Propósito:** Aislar las tareas de persistencia local y el motor SQL.
*   **Contenido:** Conversión Base64 de bytes de SQLite, lógica de autoguardado en localStorage y lógica de reinicio diario automático (24h).

### 3. Componentes de Presentación e Interfaz (`js/discipulado-view.js` y `js/pueblo-view.js`)
*   **Propósito:** Implementar la interfaz visual e interactividad de cada módulo en React.
*   **Contenido:** Vistas de usuario, filtros, buscadores, control de edición de nombres y generación de reportes en PDF.
