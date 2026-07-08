# Sistema de Asistencia - Monte Carmelo

Sistema de registro de asistencia para reuniones del discipulado y asistencia del pueblo.

## Características

- **Discipulado**: Registro de hermanos con estados (Presente/Reportado/Ausencia).
- **Pueblo**: Registro por categorías (Alabanza, Danza, Cafetería, Pueblo en General, etc.).
- **PDF**: Generación de reportes detallados y filtrados en PDF para compartir fácilmente.
- **Base de datos local**: Los datos se guardan en el almacenamiento local del navegador (SQLite).

## Estructura del Proyecto

```
/Asistencia-Discipulado
├── index.html              # Estructura HTML y carga de librerías
├── styles.css              # Estilos personalizados y variables de diseño
├── app.js                  # Orquestador del enrutamiento y componente raíz <App />
├── js/
│   ├── constants.js        # Configuración inicial, constantes y datos estáticos
│   ├── db.js               # Funciones de persistencia e infraestructura (SQLite)
│   ├── discipulado-view.js # Vista e interactividad para la asistencia del Discipulado
│   └── pueblo-view.js      # Vista e interactividad para la asistencia del Pueblo
├── docs/
│   └── refactorizacion.md  # Detalles del diseño arquitectónico de la refactorización
├── README.md               # Descripción del proyecto
└── AGENTS.md               # Reglas de desarrollo obligatorias
```

## Uso y Ejecución Local

Debido a que la aplicación está estructurada utilizando módulos de JavaScript (ES6 Modules)
que cargan archivos de forma asíncrona, los navegadores bloquean el acceso a los archivos
si se abre el archivo `index.html` haciendo doble clic desde el explorador de archivos (error CORS).

Para probar la aplicación localmente, debes servirla a través de un servidor HTTP local:

### Opción 1: Python (recomendada)
Ejecuta el siguiente comando en la terminal desde el directorio del proyecto:
```bash
python3 -m http.server 8081
```
Luego, abre en tu navegador: `http://localhost:8081`

### Opción 2: VS Code Live Server
Instala la extensión "Live Server" en VS Code, haz clic derecho sobre `index.html` y selecciona 
"Open with Live Server".

## Compartir en GitHub Pages

1. Sube todos los archivos (incluyendo la carpeta `js/` y `docs/`) a tu repositorio en GitHub.
2. Ve a Settings > Pages en el menú de configuración de tu repositorio.
3. En la sección "Build and deployment", selecciona la rama `main` (o la que utilices) y guarda.
4. GitHub Pages servirá la aplicación de forma estática sin necesidad de compilar ningún código.

## Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge).
- Conexión a internet (para descargar las librerías necesarias desde la CDN en tiempo de ejecución).

## Tecnologías Usadas

- React 18 (Interfaz de usuario y reactividad).
- Tailwind CSS (Estilos y responsividad).
- SQL.js (Base de datos SQLite embebida en el navegador).
- jsPDF + autoTable (Generación dinámica de reportes en PDF).
- Lucide (Iconos SVG).

---

Monte Carmelo - 2026
